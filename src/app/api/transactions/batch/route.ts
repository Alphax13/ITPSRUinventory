// src/app/api/transactions/batch/route.ts
import { NextResponse } from 'next/server';
import { TransactionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface BatchTransactionItem {
  materialId: string;
  quantity: number;
  reason: string;
  type: 'IN' | 'OUT';
}

interface BatchTransactionRequest {
  userId: string;
  transactions: BatchTransactionItem[];
}

// POST: สร้างรายการเบิก-จ่ายแบบ batch (ทีละหลายรายการ)
export async function POST(request: Request) {
  try {
    const body: BatchTransactionRequest = await request.json();
    const { userId, transactions } = body;

    if (!userId || !transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or empty transactions' }, { status: 400 });
    }

    // Validate all transaction items
    for (const transaction of transactions) {
      if (!transaction.materialId || !transaction.quantity || !transaction.type) {
        return NextResponse.json({ error: 'Invalid transaction item' }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdTransactions = [];
      const stockUpdates = [];

      console.log(`Processing ${transactions.length} transactions...`);

      // Process each transaction
      for (const transactionItem of transactions) {
        const { materialId, quantity, reason, type } = transactionItem;
        const transactionType = type === 'OUT' ? TransactionType.OUT : TransactionType.IN;

        // Try to find material in ConsumableMaterial first, then Material (legacy)
        let material: any = null;
        let materialType: 'consumable' | 'legacy' = 'legacy';

        // Check consumable materials first
        const consumableMaterial = await tx.consumableMaterial.findUnique({
          where: { id: materialId },
        });

        if (consumableMaterial) {
          material = consumableMaterial;
          materialType = 'consumable';
        } else {
          // Check legacy materials
          const legacyMaterial = await tx.material.findUnique({
            where: { id: materialId },
          });
          if (legacyMaterial) {
            material = legacyMaterial;
            materialType = 'legacy';
          }
        }

        if (!material) {
          throw new Error(`Material with ID ${materialId} not found`);
        }

        console.log(`Processing material: ${material.name} (Type: ${materialType})`);
        console.log(`Current stock: ${material.currentStock}, Transaction: ${type} ${quantity}`);

        // Calculate new stock
        let newStock = material.currentStock;
        if (transactionType === TransactionType.OUT) {
          newStock -= quantity;
          if (newStock < 0) {
            throw new Error(`Insufficient stock for material "${material.name}". Available: ${material.currentStock}, Requested: ${quantity}`);
          }
        } else {
          newStock += quantity;
        }

        // Create transaction record based on material type
        if (materialType === 'consumable') {
          // Create consumable transaction
          const newTransaction = await tx.consumableTransaction.create({
            data: {
              userId: userId,
              consumableMaterialId: materialId,
              quantity: quantity,
              note: reason,
              type: transactionType,
            },
            include: {
              consumableMaterial: {
                select: { name: true, unit: true, category: true },
              },
              user: {
                select: { name: true, department: true },
              },
            },
          });
          
          createdTransactions.push({
            ...newTransaction,
            material: {
              name: newTransaction.consumableMaterial.name,
              code: `CON-${materialId.slice(-6)}`,
              unit: newTransaction.consumableMaterial.unit,
            }
          });
        } else {
          // Create legacy transaction
          const newTransaction = await tx.transaction.create({
            data: {
              userId: userId,
              materialId: materialId,
              quantity: quantity,
              reason: reason,
              type: transactionType,
            },
            include: {
              material: {
                select: { name: true, code: true, unit: true },
              },
              user: {
                select: { name: true, department: true },
              },
            },
          });
          
          createdTransactions.push(newTransaction);
        }

        // Store stock update for later execution
        stockUpdates.push({
          materialId,
          newStock,
          materialType,
        } as { materialId: string; newStock: number; materialType: 'consumable' | 'legacy' });
      }

      // Update all material stocks based on type
      for (const update of stockUpdates) {
        if (update.materialType === 'consumable') {
          await tx.consumableMaterial.update({
            where: { id: update.materialId },
            data: {
              currentStock: update.newStock,
            },
          });
        } else {
          await tx.material.update({
            where: { id: update.materialId },
            data: {
              currentStock: update.newStock,
            },
          });
        }
      }

      console.log(`Successfully processed ${createdTransactions.length} transactions`);
      
      return {
        transactions: createdTransactions,
        totalProcessed: createdTransactions.length,
      };
    }, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating batch transaction:', error);
    return NextResponse.json({ 
      error: 'Failed to create batch transaction: ' + (error as Error).message 
    }, { status: 500 });
  }
}


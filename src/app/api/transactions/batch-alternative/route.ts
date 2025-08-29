// src/app/api/transactions/batch-alternative/route.ts
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

// POST: สร้างรายการเบิก-จ่ายแบบ batch (ทีละรายการ)
export async function POST(request: Request) {
  try {
    const body: BatchTransactionRequest = await request.json();
    const { userId, transactions } = body;

    if (!userId || !transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or empty transactions' }, { status: 400 });
    }

    // Validate all transaction items first
    for (const transaction of transactions) {
      if (!transaction.materialId || !transaction.quantity || !transaction.type) {
        return NextResponse.json({ error: 'Invalid transaction item' }, { status: 400 });
      }
    }

    const createdTransactions = [];
    const errors = [];

    // Process each transaction individually
    for (let i = 0; i < transactions.length; i++) {
      const transactionItem = transactions[i];
      try {
        const { materialId, quantity, reason, type } = transactionItem;
        const transactionType = type === 'OUT' ? TransactionType.OUT : TransactionType.IN;

        console.log(`Processing transaction ${i + 1}/${transactions.length}: ${materialId}`);

        // Find material in either table
        let material: any = null;
        let materialType: 'consumable' | 'legacy' = 'legacy';

        const consumableMaterial = await prisma.consumableMaterial.findUnique({
          where: { id: materialId },
        });

        if (consumableMaterial) {
          material = consumableMaterial;
          materialType = 'consumable';
        } else {
          const legacyMaterial = await prisma.material.findUnique({
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

        // Check stock for OUT transactions
        if (transactionType === TransactionType.OUT && quantity > material.currentStock) {
          throw new Error(`Insufficient stock for material "${material.name}". Available: ${material.currentStock}, Requested: ${quantity}`);
        }

        // Perform transaction in a small transaction scope
        const result = await prisma.$transaction(async (tx) => {
          // Create transaction record
          let newTransaction: any;
          
          if (materialType === 'consumable') {
            newTransaction = await tx.consumableTransaction.create({
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

            // Update consumable stock
            const newStock = transactionType === TransactionType.OUT 
              ? material.currentStock - quantity 
              : material.currentStock + quantity;

            await tx.consumableMaterial.update({
              where: { id: materialId },
              data: { currentStock: newStock },
            });

            return {
              ...newTransaction,
              material: {
                name: newTransaction.consumableMaterial.name,
                code: `CON-${materialId.slice(-6)}`,
                unit: newTransaction.consumableMaterial.unit,
              }
            };
          } else {
            newTransaction = await tx.transaction.create({
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

            // Update legacy material stock
            const newStock = transactionType === TransactionType.OUT 
              ? material.currentStock - quantity 
              : material.currentStock + quantity;

            await tx.material.update({
              where: { id: materialId },
              data: { currentStock: newStock },
            });

            return newTransaction;
          }
        });

        createdTransactions.push(result);
        console.log(`Successfully processed transaction ${i + 1}`);

      } catch (error) {
        console.error(`Error processing transaction ${i + 1}:`, error);
        errors.push({
          index: i,
          materialId: transactionItem.materialId,
          error: (error as Error).message
        });
      }
    }

    // Return results
    const response = {
      totalRequested: transactions.length,
      successful: createdTransactions.length,
      failed: errors.length,
      transactions: createdTransactions,
      errors: errors
    };

    if (errors.length > 0) {
      console.log(`Batch completed with ${errors.length} errors out of ${transactions.length} transactions`);
      return NextResponse.json({
        ...response,
        message: `Partially successful: ${createdTransactions.length}/${transactions.length} transactions completed`
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error in batch transaction alternative:', error);
    return NextResponse.json({ 
      error: 'Failed to process batch transaction: ' + (error as Error).message 
    }, { status: 500 });
  }
}

// src/utils/apiClient.ts
interface ApiClientOptions extends RequestInit {
  requireAuth?: boolean;
}

export class ApiClient {
  private static async handleResponse(response: Response) {
    if (response.status === 401) {
      // Redirect to login on unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If can't parse JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response;
  }

  static async fetch(url: string, options: ApiClientOptions = {}) {
    const { requireAuth = true, ...fetchOptions } = options;

    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    };

    try {
      const response = await fetch(url, defaultOptions);
      return await this.handleResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  static async get(url: string, options?: ApiClientOptions) {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  static async post(url: string, data?: any, options?: ApiClientOptions) {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put(url: string, data?: any, options?: ApiClientOptions) {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete(url: string, options?: ApiClientOptions) {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }

  static async patch(url: string, data?: any, options?: ApiClientOptions) {
    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export default ApiClient;

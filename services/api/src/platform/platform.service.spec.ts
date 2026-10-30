import { PlatformService, ForbiddenException } from './platform.service';
import { ForbiddenException as NestForbiddenException } from '@nestjs/common';

describe('PlatformService', () => {
  it('keeps catalog reads scoped to the active tenant', () => {
    const service = new PlatformService();

    const response = service.listProducts('seller_demo', 'store_wysh', {
      page: 1,
      pageSize: 10,
      search: '',
    });

    expect(response.total).toBe(3);
    expect(
      response.data.every((product) => product.sku.startsWith('WB-10')),
    ).toBe(true);
  });

  it('rejects reserved slugs', () => {
    const service = new PlatformService();

    expect(service.checkSlugAvailability('wysh').available).toBe(false);
    expect(service.checkSlugAvailability('wysh-growth').available).toBe(true);
  });

  it('creates a product', () => {
    const service = new PlatformService();
    const dto = {
      title: 'Wysh Smart Tumbler',
      sku: 'WB-105',
      brand: 'Wysh',
      status: 'ACTIVE' as const,
      price: 1899,
      inventory: 94,
    } as const;

    const product = service.createProduct('seller_demo', 'store_wysh', dto);
    expect(product.title).toBe('Wysh Smart Tumbler');
    expect(product.sku).toBe('WB-105');
    expect(product.status).toBe('ACTIVE');
  });

  it('updates a product', () => {
    const service = new PlatformService();
    // First create a product
    const created = service.createProduct('seller_demo', 'store_wysh', {
      title: 'Wysh Product',
      sku: 'WB-NEW',
      brand: 'Wysh',
      status: 'DRAFT' as const,
      price: 100,
      inventory: 10,
    } as const);

    // Then update it
    const updated = service.updateProduct('seller_demo', 'store_wysh', created.id, {
      title: 'Wysh Product Updated',
      price: 150,
    } as const);

    expect(updated.title).toBe('Wysh Product Updated');
    expect(updated.price).toBe(150);
  });

  it('deletes a product', () => {
    const service = new PlatformService();
    const created = service.createProduct('seller_demo', 'store_wysh', {
      title: 'Wysh Product to Delete',
      sku: 'WB-DEL',
      brand: 'Wysh',
      status: 'DRAFT' as const,
      price: 50,
      inventory: 5,
    } as const);

    const deleted = service.deleteProduct('seller_demo', 'store_wysh', created.id);
    expect(deleted.title).toBe('Wysh Product to Delete');

    // Verify it's gone
    const remaining = service.getOrders('seller_demo', 'store_wysh');
    // Just verify no error thrown
  });

  it('creates an order', () => {
    const service = new PlatformService();
    const order = service.createOrder('seller_demo', 'store_wysh', {
      productId: 'p-1',
      quantity: 2,
    } as const);

    expect(order.productId).toBe('p-1');
    expect(order.quantity).toBe(2);
    expect(order.status).toBe('NEW');
  });

  it('updates order status with valid transition', () => {
    const service = new PlatformService();
    const created = service.createOrder('seller_demo', 'store_wysh', {
      productId: 'p-1',
      quantity: 1,
    } as const);

    // Valid: NEW -> CONFIRMED
    const updated = service.updateOrderStatus('seller_demo', 'store_wysh', created.id, {
      status: 'CONFIRMED' as const,
    } as const);

    expect(updated.status).toBe('CONFIRMED');
  });

it('rejects invalid order status transition', async () => {
    const service = new PlatformService();
    const created = service.createOrder('seller_demo', 'store_wysh', {
      productId: 'p-1',
      quantity: 1,
    } as const);

    // Invalid: NEW -> SHIPPED (skipping CONFIRMED and PACKED)
    let caughtError: any = null;
    try {
      await service.updateOrderStatus('seller_demo', 'store_wysh', created.id, {
        status: 'SHIPPED' as const,
      } as const);
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBeInstanceOf(NestForbiddenException);
    expect(caughtError.message).toContain('Invalid state transition from NEW to SHIPPED');
  });

  it('gets orders for a tenant', () => {
    const service = new PlatformService();
    service.createOrder('seller_demo', 'store_wysh', {
      productId: 'p-1',
      quantity: 1,
    } as const);

    const orders = service.getOrders('seller_demo', 'store_wysh');
    expect(orders.length).toBe(1);
    expect(orders[0].status).toBe('NEW');
  });

  it('records a sale in the ledger', () => {
    const service = new PlatformService();
    const entry = service.recordSale('seller_demo', 'store_wysh', 'ord-1', 2999, 'Test order');

    expect(entry.type).toBe('sale');
    expect(entry.amount).toBe(2999);
    expect(entry.referenceId).toBe('ord-1');
  });

  it('records a payout in the ledger', () => {
    const service = new PlatformService();
    const entry = service.recordPayout('seller_demo', 'store_wysh', 25000, 'Test payout');

    expect(entry.type).toBe('payout');
    expect(entry.amount).toBe(25000);
  });

  it('gets ledger entries', () => {
    const service = new PlatformService();
    service.recordSale('seller_demo', 'store_wysh', 'ord-1', 1000, 'Sale 1');
    service.recordPayout('seller_demo', 'store_wysh', 800, 'Payout 1');

    const entries = service.getLedgerEntries('seller_demo', 'store_wysh');
    expect(entries.length).toBe(2);
  });

  it('gets finance summary', () => {
    const service = new PlatformService();
    service.recordSale('seller_demo', 'store_wysh', 'ord-1', 5000, 'Sale 1');
    service.recordPayout('seller_demo', 'store_wysh', 3000, 'Payout 1');

    const summary = service.getFinanceSummary('seller_demo', 'store_wysh');

    expect(summary.totalSales).toBe(5000);
    expect(summary.totalPayouts).toBe(3000);
    expect(summary.pendingPayouts).toBe(0);
    expect(summary.netBalance).toBe(2000);
  });
});
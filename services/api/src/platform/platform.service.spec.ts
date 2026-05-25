import { PlatformService } from './platform.service';

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
});

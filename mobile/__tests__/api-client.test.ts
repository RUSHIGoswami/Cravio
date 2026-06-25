describe('generated API client', () => {
  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ status: 'ok', db: true, redis: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;
  });

  test('calls GET /health and returns the typed Health payload', async () => {
    // openapi-fetch captures `fetch` when its client is created, so the client
    // must be (re)imported after the mock is installed above.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getHealth } = require('../src/api/client');
    const health = await getHealth();
    expect(health).toEqual({ status: 'ok', db: true, redis: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [request] = (fetch as jest.Mock).mock.calls[0];
    expect(String(request.url ?? request)).toContain('/health');
  });
});

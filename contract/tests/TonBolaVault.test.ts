import { Blockchain, SandboxContract } from '@ton/sandbox';
import { toNano, fromNano } from '@ton/core';
import { TonBolaVault } from '../build/TonBolaVault/TonBolaVault_TonBolaVault';
import '@ton/test-utils';

describe('TonBolaVault', () => {
    let blockchain: Blockchain;
    let vault: SandboxContract<TonBolaVault>;

    const BINGO = 0n, WHEEL = 1n, SCRATCH = 2n;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        const owner  = await blockchain.treasury('owner');
        const oracle = await blockchain.treasury('oracle');

        vault = blockchain.openContract(
            await TonBolaVault.fromInit(owner.address, oracle.address)
        );
        const r = await vault.send(owner.getSender(), { value: toNano('0.5') },
            { $$type: 'Deploy', queryId: 0n });
        expect(r.transactions).toHaveTransaction({ success: true });
    });

    const pay = async (gameType: bigint, gameId: bigint, amount: string) => {
        const player = await blockchain.treasury('player' + gameId);
        return vault.send(player.getSender(), { value: toNano(amount) },
            { $$type: 'GamePayment', game_type: gameType, game_id: gameId });
    };

    // ── TEST 1: Split 0.25 TON ────────────────────────────────
    test('Split universale 0.25 TON', async () => {
        await pay(BINGO, 1001n, '0.25');

        const pool = Number(fromNano(await vault.getGetPool(1001n)));
        const jp   = Number(fromNano(await vault.getJackpotBingo()));
        const rwi  = Number(fromNano(await vault.getRankWeeklyInd()));
        const dev  = Number(fromNano(await vault.getDevBalance()));

        expect(pool).toBeCloseTo(0.1375, 3);   // 55%
        expect(jp).toBeCloseTo(0.0125, 3);      // 5%
        expect(rwi).toBeCloseTo(0.00375, 4);    // 1.5%
        expect(dev).toBeCloseTo(0.09, 3);       // 36%

        console.log(`✅ Split: prize=${pool.toFixed(4)} jp=${jp.toFixed(4)} dev=${dev.toFixed(4)}`);
    });

    // ── TEST 2: Pool cresce con più giocatori ─────────────────
    test('Pool cresce con 3 giocatori', async () => {
        for (let i = 0; i < 3; i++) await pay(BINGO, 1002n, '0.25');
        const pool = Number(fromNano(await vault.getGetPool(1002n)));
        expect(pool).toBeCloseTo(0.4125, 3);  // 3 × 0.1375
        console.log(`✅ Pool 3 giocatori: ${pool.toFixed(4)} TON`);
    });

    // ── TEST 3: Oracle paga vincitore ─────────────────────────
    test('Oracle paga bingo winner', async () => {
        for (let i = 0; i < 5; i++) await pay(BINGO, 1003n, '0.25');
        const oracle  = await blockchain.treasury('oracle');
        const winner  = await blockchain.treasury('winner');
        const poolNano = await vault.getGetPool(1003n);
        const winAmt   = poolNano * 75n / 100n;

        const r = await vault.send(oracle.getSender(), { value: toNano('0.05') },
            { $$type: 'PayWinner', game_id: 1003n, winner: winner.address,
              amount: winAmt, win_type: 1n });
        expect(r.transactions).toHaveTransaction({ success: true });
        console.log(`✅ Bingo payout: ${fromNano(winAmt)} TON`);
    });

    // ── TEST 4: Jackpot threshold ─────────────────────────────
    test('Jackpot rifiutato sotto 5 TON', async () => {
        await pay(WHEEL, 1004n, '1');
        const jp = Number(fromNano(await vault.getJackpotWheel()));
        expect(jp).toBeCloseTo(0.05, 3);  // 5% di 1 TON

        const oracle = await blockchain.treasury('oracle');
        const r = await vault.send(oracle.getSender(), { value: toNano('0.05') },
            { $$type: 'JackpotPayout', game_type: WHEEL,
              winner: oracle.address, amount: toNano('0.05') });
        expect(r.transactions).toHaveTransaction({ success: false });
        console.log('✅ Jackpot sotto threshold rifiutato');
    });

    // ── TEST 5: Jackpot paga sopra 5 TON ─────────────────────
    test('Jackpot paga sopra 5 TON', async () => {
        await pay(WHEEL, 1005n, '110');  // jackpot = 5.5 TON
        const jp = Number(fromNano(await vault.getJackpotWheel()));
        expect(jp).toBeGreaterThan(5);

        const oracle = await blockchain.treasury('oracle');
        const winner = await blockchain.treasury('jackpot-winner');
        const r = await vault.send(oracle.getSender(), { value: toNano('0.1') },
            { $$type: 'JackpotPayout', game_type: WHEEL,
              winner: winner.address, amount: toNano('5') });
        expect(r.transactions).toHaveTransaction({ success: true });
        expect(await vault.getJackpotWheel()).toBe(0n);
        console.log(`✅ Jackpot pagato e azzerato`);
    });

    // ── TEST 6: Rank payout top 5 ─────────────────────────────
    test('Rank weekly top 5', async () => {
        for (let i = 0; i < 20; i++) await pay(BINGO, BigInt(2000 + i), '0.25');

        const pool = await vault.getRankWeeklyInd();
        const oracle = await blockchain.treasury('oracle');
        const a1 = pool * 40n / 100n;
        const a2 = pool * 25n / 100n;
        const a3 = pool * 18n / 100n;
        const a4 = pool * 11n / 100n;
        const a5 = pool * 6n  / 100n;

        const w = async (n: string) => (await blockchain.treasury(n)).address;
        const r = await vault.send(oracle.getSender(), { value: toNano('0.2') }, {
            $$type: 'PayRank', rank_type: 0n, period_key: 20240401n,
            w1: await w('r1'), a1, w2: await w('r2'), a2,
            w3: await w('r3'), a3, w4: await w('r4'), a4,
            w5: await w('r5'), a5
        });
        expect(r.transactions).toHaveTransaction({ success: true });
        expect(await vault.getRankWeeklyInd()).toBe(0n);
        console.log(`✅ Rank payout: 1°=${fromNano(a1)} 2°=${fromNano(a2)} 3°=${fromNano(a3)} TON`);
    });

    // ── TEST 7: Anti-replay ───────────────────────────────────
    test('Anti-replay period_key', async () => {
        await pay(BINGO, 1007n, '10');
        const oracle = await blockchain.treasury('oracle');
        const w = (await blockchain.treasury('w')).address;
        const pool = await vault.getRankWeeklyInd();
        const msg = { $$type: 'PayRank' as const, rank_type: 0n, period_key: 20240402n,
            w1: w, a1: pool / 2n, w2: w, a2: 0n, w3: w, a3: 0n, w4: w, a4: 0n, w5: w, a5: 0n };

        const r1 = await vault.send(oracle.getSender(), { value: toNano('0.1') }, msg);
        expect(r1.transactions).toHaveTransaction({ success: true });

        // Ricarica pool
        await pay(BINGO, 9999n, '10');

        // Stesso period_key → deve fallire
        const r2 = await vault.send(oracle.getSender(), { value: toNano('0.1') }, msg);
        expect(r2.transactions).toHaveTransaction({ success: false });
        console.log('✅ Anti-replay funziona');
    });

    // ── TEST 8: Non-oracle rifiutato ──────────────────────────
    test('Non-oracle non può pagare', async () => {
        await pay(BINGO, 1008n, '1');
        const attacker = await blockchain.treasury('attacker');
        const r = await vault.send(attacker.getSender(), { value: toNano('0.05') },
            { $$type: 'PayWinner', game_id: 1008n, winner: attacker.address,
              amount: toNano('0.1'), win_type: 1n });
        expect(r.transactions).toHaveTransaction({ success: false });
        console.log('✅ Non-oracle rifiutato');
    });

    // ── TEST 9: Dev withdrawal ────────────────────────────────
    test('Owner ritira dev balance', async () => {
        await pay(BINGO, 1009n, '1');
        const owner  = await blockchain.treasury('owner');
        const devBal = await vault.getDevBalance();
        expect(Number(fromNano(devBal))).toBeCloseTo(0.36, 2);

        const r = await vault.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'WithdrawDev', amount: devBal });
        expect(r.transactions).toHaveTransaction({ success: true });
        console.log(`✅ Dev withdrawal: ${fromNano(devBal)} TON`);
    });

    // ── TEST 10: VIP room 1 TON ───────────────────────────────
    test('Split VIP 1 TON', async () => {
        await pay(BINGO, 1010n, '1');
        const pool = Number(fromNano(await vault.getGetPool(1010n)));
        const jp   = Number(fromNano(await vault.getJackpotBingo()));
        expect(pool).toBeCloseTo(0.55, 3);
        expect(jp).toBeCloseTo(0.05, 3);
        console.log(`✅ VIP 1 TON: prize=${pool.toFixed(3)} jp=${jp.toFixed(3)}`);
    });
});

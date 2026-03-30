import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type GamePayment = {
    $$type: 'GamePayment';
    game_type: bigint;
    game_id: bigint;
    player_id: bigint;
}

export function storeGamePayment(src: GamePayment) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1198091632, 32);
        b_0.storeUint(src.game_type, 8);
        b_0.storeUint(src.game_id, 64);
        b_0.storeUint(src.player_id, 64);
    };
}

export function loadGamePayment(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1198091632) { throw Error('Invalid prefix'); }
    const _game_type = sc_0.loadUintBig(8);
    const _game_id = sc_0.loadUintBig(64);
    const _player_id = sc_0.loadUintBig(64);
    return { $$type: 'GamePayment' as const, game_type: _game_type, game_id: _game_id, player_id: _player_id };
}

export function loadTupleGamePayment(source: TupleReader) {
    const _game_type = source.readBigNumber();
    const _game_id = source.readBigNumber();
    const _player_id = source.readBigNumber();
    return { $$type: 'GamePayment' as const, game_type: _game_type, game_id: _game_id, player_id: _player_id };
}

export function loadGetterTupleGamePayment(source: TupleReader) {
    const _game_type = source.readBigNumber();
    const _game_id = source.readBigNumber();
    const _player_id = source.readBigNumber();
    return { $$type: 'GamePayment' as const, game_type: _game_type, game_id: _game_id, player_id: _player_id };
}

export function storeTupleGamePayment(source: GamePayment) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.game_type);
    builder.writeNumber(source.game_id);
    builder.writeNumber(source.player_id);
    return builder.build();
}

export function dictValueParserGamePayment(): DictionaryValue<GamePayment> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeGamePayment(src)).endCell());
        },
        parse: (src) => {
            return loadGamePayment(src.loadRef().beginParse());
        }
    }
}

export type PayWinner = {
    $$type: 'PayWinner';
    winner: Address;
    amount: bigint;
    game_id: bigint;
    nonce: bigint;
    signature: Slice;
}

export function storePayWinner(src: PayWinner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1348565335, 32);
        b_0.storeAddress(src.winner);
        b_0.storeCoins(src.amount);
        b_0.storeUint(src.game_id, 64);
        b_0.storeUint(src.nonce, 64);
        b_0.storeRef(src.signature.asCell());
    };
}

export function loadPayWinner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1348565335) { throw Error('Invalid prefix'); }
    const _winner = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    const _game_id = sc_0.loadUintBig(64);
    const _nonce = sc_0.loadUintBig(64);
    const _signature = sc_0.loadRef().asSlice();
    return { $$type: 'PayWinner' as const, winner: _winner, amount: _amount, game_id: _game_id, nonce: _nonce, signature: _signature };
}

export function loadTuplePayWinner(source: TupleReader) {
    const _winner = source.readAddress();
    const _amount = source.readBigNumber();
    const _game_id = source.readBigNumber();
    const _nonce = source.readBigNumber();
    const _signature = source.readCell().asSlice();
    return { $$type: 'PayWinner' as const, winner: _winner, amount: _amount, game_id: _game_id, nonce: _nonce, signature: _signature };
}

export function loadGetterTuplePayWinner(source: TupleReader) {
    const _winner = source.readAddress();
    const _amount = source.readBigNumber();
    const _game_id = source.readBigNumber();
    const _nonce = source.readBigNumber();
    const _signature = source.readCell().asSlice();
    return { $$type: 'PayWinner' as const, winner: _winner, amount: _amount, game_id: _game_id, nonce: _nonce, signature: _signature };
}

export function storeTuplePayWinner(source: PayWinner) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.winner);
    builder.writeNumber(source.amount);
    builder.writeNumber(source.game_id);
    builder.writeNumber(source.nonce);
    builder.writeSlice(source.signature.asCell());
    return builder.build();
}

export function dictValueParserPayWinner(): DictionaryValue<PayWinner> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePayWinner(src)).endCell());
        },
        parse: (src) => {
            return loadPayWinner(src.loadRef().beginParse());
        }
    }
}

export type PayJackpot = {
    $$type: 'PayJackpot';
    winner: Address;
    pool_id: bigint;
    nonce: bigint;
    signature: Slice;
}

export function storePayJackpot(src: PayJackpot) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1247896427, 32);
        b_0.storeAddress(src.winner);
        b_0.storeUint(src.pool_id, 8);
        b_0.storeUint(src.nonce, 64);
        b_0.storeRef(src.signature.asCell());
    };
}

export function loadPayJackpot(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1247896427) { throw Error('Invalid prefix'); }
    const _winner = sc_0.loadAddress();
    const _pool_id = sc_0.loadUintBig(8);
    const _nonce = sc_0.loadUintBig(64);
    const _signature = sc_0.loadRef().asSlice();
    return { $$type: 'PayJackpot' as const, winner: _winner, pool_id: _pool_id, nonce: _nonce, signature: _signature };
}

export function loadTuplePayJackpot(source: TupleReader) {
    const _winner = source.readAddress();
    const _pool_id = source.readBigNumber();
    const _nonce = source.readBigNumber();
    const _signature = source.readCell().asSlice();
    return { $$type: 'PayJackpot' as const, winner: _winner, pool_id: _pool_id, nonce: _nonce, signature: _signature };
}

export function loadGetterTuplePayJackpot(source: TupleReader) {
    const _winner = source.readAddress();
    const _pool_id = source.readBigNumber();
    const _nonce = source.readBigNumber();
    const _signature = source.readCell().asSlice();
    return { $$type: 'PayJackpot' as const, winner: _winner, pool_id: _pool_id, nonce: _nonce, signature: _signature };
}

export function storeTuplePayJackpot(source: PayJackpot) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.winner);
    builder.writeNumber(source.pool_id);
    builder.writeNumber(source.nonce);
    builder.writeSlice(source.signature.asCell());
    return builder.build();
}

export function dictValueParserPayJackpot(): DictionaryValue<PayJackpot> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePayJackpot(src)).endCell());
        },
        parse: (src) => {
            return loadPayJackpot(src.loadRef().beginParse());
        }
    }
}

export type UpdateConfig = {
    $$type: 'UpdateConfig';
    dev_wallet: Address;
    token_fund: Address;
    leaderboard_wallet: Address;
    platform_wallet: Address;
    oracle_pubkey: bigint;
}

export function storeUpdateConfig(src: UpdateConfig) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1131376230, 32);
        b_0.storeAddress(src.dev_wallet);
        b_0.storeAddress(src.token_fund);
        b_0.storeAddress(src.leaderboard_wallet);
        const b_1 = new Builder();
        b_1.storeAddress(src.platform_wallet);
        b_1.storeUint(src.oracle_pubkey, 256);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadUpdateConfig(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1131376230) { throw Error('Invalid prefix'); }
    const _dev_wallet = sc_0.loadAddress();
    const _token_fund = sc_0.loadAddress();
    const _leaderboard_wallet = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _platform_wallet = sc_1.loadAddress();
    const _oracle_pubkey = sc_1.loadUintBig(256);
    return { $$type: 'UpdateConfig' as const, dev_wallet: _dev_wallet, token_fund: _token_fund, leaderboard_wallet: _leaderboard_wallet, platform_wallet: _platform_wallet, oracle_pubkey: _oracle_pubkey };
}

export function loadTupleUpdateConfig(source: TupleReader) {
    const _dev_wallet = source.readAddress();
    const _token_fund = source.readAddress();
    const _leaderboard_wallet = source.readAddress();
    const _platform_wallet = source.readAddress();
    const _oracle_pubkey = source.readBigNumber();
    return { $$type: 'UpdateConfig' as const, dev_wallet: _dev_wallet, token_fund: _token_fund, leaderboard_wallet: _leaderboard_wallet, platform_wallet: _platform_wallet, oracle_pubkey: _oracle_pubkey };
}

export function loadGetterTupleUpdateConfig(source: TupleReader) {
    const _dev_wallet = source.readAddress();
    const _token_fund = source.readAddress();
    const _leaderboard_wallet = source.readAddress();
    const _platform_wallet = source.readAddress();
    const _oracle_pubkey = source.readBigNumber();
    return { $$type: 'UpdateConfig' as const, dev_wallet: _dev_wallet, token_fund: _token_fund, leaderboard_wallet: _leaderboard_wallet, platform_wallet: _platform_wallet, oracle_pubkey: _oracle_pubkey };
}

export function storeTupleUpdateConfig(source: UpdateConfig) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.dev_wallet);
    builder.writeAddress(source.token_fund);
    builder.writeAddress(source.leaderboard_wallet);
    builder.writeAddress(source.platform_wallet);
    builder.writeNumber(source.oracle_pubkey);
    return builder.build();
}

export function dictValueParserUpdateConfig(): DictionaryValue<UpdateConfig> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUpdateConfig(src)).endCell());
        },
        parse: (src) => {
            return loadUpdateConfig(src.loadRef().beginParse());
        }
    }
}

export type WinnerPaid = {
    $$type: 'WinnerPaid';
    winner: Address;
    amount: bigint;
    game_id: bigint;
}

export function storeWinnerPaid(src: WinnerPaid) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3287422055, 32);
        b_0.storeAddress(src.winner);
        b_0.storeCoins(src.amount);
        b_0.storeUint(src.game_id, 64);
    };
}

export function loadWinnerPaid(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3287422055) { throw Error('Invalid prefix'); }
    const _winner = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    const _game_id = sc_0.loadUintBig(64);
    return { $$type: 'WinnerPaid' as const, winner: _winner, amount: _amount, game_id: _game_id };
}

export function loadTupleWinnerPaid(source: TupleReader) {
    const _winner = source.readAddress();
    const _amount = source.readBigNumber();
    const _game_id = source.readBigNumber();
    return { $$type: 'WinnerPaid' as const, winner: _winner, amount: _amount, game_id: _game_id };
}

export function loadGetterTupleWinnerPaid(source: TupleReader) {
    const _winner = source.readAddress();
    const _amount = source.readBigNumber();
    const _game_id = source.readBigNumber();
    return { $$type: 'WinnerPaid' as const, winner: _winner, amount: _amount, game_id: _game_id };
}

export function storeTupleWinnerPaid(source: WinnerPaid) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.winner);
    builder.writeNumber(source.amount);
    builder.writeNumber(source.game_id);
    return builder.build();
}

export function dictValueParserWinnerPaid(): DictionaryValue<WinnerPaid> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeWinnerPaid(src)).endCell());
        },
        parse: (src) => {
            return loadWinnerPaid(src.loadRef().beginParse());
        }
    }
}

export type TonBolaVault$Data = {
    $$type: 'TonBolaVault$Data';
    owner: Address;
    dev_wallet: Address;
    token_fund: Address;
    leaderboard_wallet: Address;
    platform_wallet: Address;
    oracle_pubkey: bigint;
    last_nonce: bigint;
    jackpot_ton: bigint;
    total_in: bigint;
    total_paid: bigint;
    game_count: bigint;
    prize_pool: bigint;
}

export function storeTonBolaVault$Data(src: TonBolaVault$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.dev_wallet);
        b_0.storeAddress(src.token_fund);
        const b_1 = new Builder();
        b_1.storeAddress(src.leaderboard_wallet);
        b_1.storeAddress(src.platform_wallet);
        b_1.storeUint(src.oracle_pubkey, 256);
        b_1.storeUint(src.last_nonce, 64);
        b_1.storeCoins(src.jackpot_ton);
        const b_2 = new Builder();
        b_2.storeCoins(src.total_in);
        b_2.storeCoins(src.total_paid);
        b_2.storeUint(src.game_count, 64);
        b_2.storeCoins(src.prize_pool);
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadTonBolaVault$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _dev_wallet = sc_0.loadAddress();
    const _token_fund = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _leaderboard_wallet = sc_1.loadAddress();
    const _platform_wallet = sc_1.loadAddress();
    const _oracle_pubkey = sc_1.loadUintBig(256);
    const _last_nonce = sc_1.loadUintBig(64);
    const _jackpot_ton = sc_1.loadCoins();
    const sc_2 = sc_1.loadRef().beginParse();
    const _total_in = sc_2.loadCoins();
    const _total_paid = sc_2.loadCoins();
    const _game_count = sc_2.loadUintBig(64);
    const _prize_pool = sc_2.loadCoins();
    return { $$type: 'TonBolaVault$Data' as const, owner: _owner, dev_wallet: _dev_wallet, token_fund: _token_fund, leaderboard_wallet: _leaderboard_wallet, platform_wallet: _platform_wallet, oracle_pubkey: _oracle_pubkey, last_nonce: _last_nonce, jackpot_ton: _jackpot_ton, total_in: _total_in, total_paid: _total_paid, game_count: _game_count, prize_pool: _prize_pool };
}

export function loadTupleTonBolaVault$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _dev_wallet = source.readAddress();
    const _token_fund = source.readAddress();
    const _leaderboard_wallet = source.readAddress();
    const _platform_wallet = source.readAddress();
    const _oracle_pubkey = source.readBigNumber();
    const _last_nonce = source.readBigNumber();
    const _jackpot_ton = source.readBigNumber();
    const _total_in = source.readBigNumber();
    const _total_paid = source.readBigNumber();
    const _game_count = source.readBigNumber();
    const _prize_pool = source.readBigNumber();
    return { $$type: 'TonBolaVault$Data' as const, owner: _owner, dev_wallet: _dev_wallet, token_fund: _token_fund, leaderboard_wallet: _leaderboard_wallet, platform_wallet: _platform_wallet, oracle_pubkey: _oracle_pubkey, last_nonce: _last_nonce, jackpot_ton: _jackpot_ton, total_in: _total_in, total_paid: _total_paid, game_count: _game_count, prize_pool: _prize_pool };
}

export function loadGetterTupleTonBolaVault$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _dev_wallet = source.readAddress();
    const _token_fund = source.readAddress();
    const _leaderboard_wallet = source.readAddress();
    const _platform_wallet = source.readAddress();
    const _oracle_pubkey = source.readBigNumber();
    const _last_nonce = source.readBigNumber();
    const _jackpot_ton = source.readBigNumber();
    const _total_in = source.readBigNumber();
    const _total_paid = source.readBigNumber();
    const _game_count = source.readBigNumber();
    const _prize_pool = source.readBigNumber();
    return { $$type: 'TonBolaVault$Data' as const, owner: _owner, dev_wallet: _dev_wallet, token_fund: _token_fund, leaderboard_wallet: _leaderboard_wallet, platform_wallet: _platform_wallet, oracle_pubkey: _oracle_pubkey, last_nonce: _last_nonce, jackpot_ton: _jackpot_ton, total_in: _total_in, total_paid: _total_paid, game_count: _game_count, prize_pool: _prize_pool };
}

export function storeTupleTonBolaVault$Data(source: TonBolaVault$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.dev_wallet);
    builder.writeAddress(source.token_fund);
    builder.writeAddress(source.leaderboard_wallet);
    builder.writeAddress(source.platform_wallet);
    builder.writeNumber(source.oracle_pubkey);
    builder.writeNumber(source.last_nonce);
    builder.writeNumber(source.jackpot_ton);
    builder.writeNumber(source.total_in);
    builder.writeNumber(source.total_paid);
    builder.writeNumber(source.game_count);
    builder.writeNumber(source.prize_pool);
    return builder.build();
}

export function dictValueParserTonBolaVault$Data(): DictionaryValue<TonBolaVault$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTonBolaVault$Data(src)).endCell());
        },
        parse: (src) => {
            return loadTonBolaVault$Data(src.loadRef().beginParse());
        }
    }
}

 type TonBolaVault_init_args = {
    $$type: 'TonBolaVault_init_args';
    dev_wallet: Address;
    token_fund: Address;
    leaderboard_wallet: Address;
    platform_wallet: Address;
    oracle_pubkey: bigint;
}

function initTonBolaVault_init_args(src: TonBolaVault_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.dev_wallet);
        b_0.storeAddress(src.token_fund);
        b_0.storeAddress(src.leaderboard_wallet);
        const b_1 = new Builder();
        b_1.storeAddress(src.platform_wallet);
        b_1.storeInt(src.oracle_pubkey, 257);
        b_0.storeRef(b_1.endCell());
    };
}

async function TonBolaVault_init(dev_wallet: Address, token_fund: Address, leaderboard_wallet: Address, platform_wallet: Address, oracle_pubkey: bigint) {
    const __code = Cell.fromHex('b5ee9c7241022d01000923000228ff008e88f4a413f4bcf2c80bed5320e303ed43d901180202710207020120030501cbba96ced44d0d200018e27fa40fa40fa40d401d0fa40fa40d3ffd33ffa00d430d0fa00fa00d33ffa0030109c109b109a6c1c8e2dfa40fa40fa40d401d0fa40810101d7003010251024102305d15503f842705470005300106b106a106910681067e2db3c6cc180400022501cbb851ded44d0d200018e27fa40fa40fa40d401d0fa40fa40d3ffd33ffa00d430d0fa00fa00d33ffa0030109c109b109a6c1c8e2dfa40fa40fa40d401d0fa40810101d7003010251024102305d15503f842705470005300106b106a106910681067e2db3c6cc180600022b020120081302012009110201200a0c01cbb07b7b51343480006389fe903e903e903500743e903e9034fff4cffe80350c343e803e8034cffe800c04270426c4269b07238b7e903e903e903500743e9020404075c00c040944090408c1745540fe109c151c0014c0041ac41a841a441a0419f8b6cf1b30600b0002200201480d0f01caa9a4ed44d0d200018e27fa40fa40fa40d401d0fa40fa40d3ffd33ffa00d430d0fa00fa00d33ffa0030109c109b109a6c1c8e2dfa40fa40fa40d401d0fa40810101d7003010251024102305d15503f842705470005300106b106a106910681067e2db3c6cc10e00022101caaac0ed44d0d200018e27fa40fa40fa40d401d0fa40fa40d3ffd33ffa00d430d0fa00fa00d33ffa0030109c109b109a6c1c8e2dfa40fa40fa40d401d0fa40810101d7003010251024102305d15503f842705470005300106b106a106910681067e2db3c6cc1100008f8276f1001cbb60d9da89a1a400031c4ff481f481f481a803a1f481f481a7ffa67ff401a861a1f401f401a67ff40060213821362134d8391c5bf481f481f481a803a1f481020203ae0060204a204820460ba2aa07f084e0a8e000a60020d620d420d220d020cfc5b678d983012000223020120141601cbb68cfda89a1a400031c4ff481f481f481a803a1f481f481a7ffa67ff401a861a1f401f401a67ff40060213821362134d8391c5bf481f481f481a803a1f481020203ae0060204a204820460ba2aa07f084e0a8e000a60020d620d420d220d020cfc5b678d98301500022401cbb54adda89a1a400031c4ff481f481f481a803a1f481f481a7ffa67ff401a861a1f401f401a67ff40060213821362134d8391c5bf481f481f481a803a1f481020203ae0060204a204820460ba2aa07f084e0a8e000a60020d620d420d220d020cfc5b678d98301700022201f830eda2edfb01d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e27fa40fa40fa40d401d0fa40fa40d3ffd33ffa00d430d0fa00fa00d33ffa0030109c109b109a6c1c8e2dfa40fa40fa40d401d0fa40810101d7003010251024102305d15503f842705470005300106b106a106910681067e20d1902fe925f0de02bd749c21fe3000bf9012082f0d9826f388f86bf17e64aff3e42bd8ea06a7a9cb789e42993d10fc8d47001873aba8e4b30f8416f24135f0313a0109b108a10791068105710461035504403c87f01ca0055b050bcce19ce17ce05c8ce14ce12cbffcb3f01fa02c85003fa025003fa0213cb3f5003fa02cdcdc9ed541a2804520bd31f21821047696d70bae30221821050617957bae3022182104a61636bbae302018210436f6e66ba1b21242703fe5bf8416f24135f038200908a21820afaf080bef2f420820afaf080a120810c80a8812710a90421810320a8812710a9042281012ca8812710a904238100c8a8812710a9045143a122a121a124a1727088561104075520441359c8cf8580ca00cf8440ce01fa02806acf40f400c901fb007270882f04055520441359c8cf85801c1d1e0016000000006465765f666565001c00000000746f6b656e5f66756e6403dcca00cf8440ce01fa02806acf40f400c901fb007270882d5530441359c8cf8580ca00cf8440ce01fa02806acf40f400c901fb007270882b04055520441359c8cf8580ca00cf8440ce01fa02806acf40f400c901fb005033a050c2a00aa4109b108a107910681057104610354403021f20230028000000006c6561646572626f6172645f66756e64002000000000706c6174666f726d5f66656502e431fa40fa00d33fd33fd430d0218142c30abc19f2f4c824cf1623fa0212cb3f5210cb3fc9f9008200bd115189f91017f2f48200d557f8276f1022820afaf080a0bef2f45122a053d2be9451d2a10dde7270881035441359c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00109b5518222300200000000077696e6e65725f7072697a650064c87f01ca0055b050bcce19ce17ce05c8ce14ce12cbffcb3f01fa02c85003fa025003fa0213cb3f5003fa02cdcdc9ed54db3102fe31fa40d307d33fd430d0218142c309bc18f2f4c823cf1612cb075210cb3fc9f9008200bd115178f91016f2f482008a3b2482101dcd6500bef2f48200d557f8276f1025820afaf080a0bef2f4705124a07270881037441359c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00109b108a1079106810571046103550442526001e000000006a61636b706f745f77696e006603c87f01ca0055b050bcce19ce17ce05c8ce14ce12cbffcb3f01fa02c85003fa025003fa0213cb3f5003fa02cdcdc9ed54db3101d88ee8fa40fa40fa40d430d0fa40d3ff3010be10ad109c108e107d106c105e104d103c102e11101fdb3c3636363636106b108a107910785540c87f01ca0055b050bcce19ce17ce05c8ce14ce12cbffcb3f01fa02c85003fa025003fa0213cb3f5003fa02cdcdc9ed54db31e00b2a01fce02082f093778c1ac58756849ac6e8b83a88ca05d0f155c1d67d5e2e3a09d8279d92ebdeba8e563082008aabf8422bc705f2f4f8416f24135f031ca0109b108a10791068105710461035443012c87f01ca0055b050bcce19ce17ce05c8ce14ce12cbffcb3f01fa02c85003fa025003fa0213cb3f5003fa02cdcdc9ed54e02903fc82f02c88801bb4b1d234a2db0b0c1474e2b9961dc9db193a312bd6ef09612462a3c5ba8f58109b5518db3c70830670882f5530441359c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055b050bcce19ce17ce05c8ce14ce12cbffcb3f01fa02c85003fa025003fa0213cb3f5003fa02cdcdc9ed54e02a2b2c00148138c6f8422dc705f2f4001a00000000656d657267656e6379000a5f0cf2c08269fa1041');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initTonBolaVault_init_args({ $$type: 'TonBolaVault_init_args', dev_wallet, token_fund, leaderboard_wallet, platform_wallet, oracle_pubkey })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const TonBolaVault_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    14534: { message: "Not owner" },
    17091: { message: "Nonce already used" },
    35387: { message: "Jackpot below minimum" },
    35499: { message: "Only owner" },
    37002: { message: "Amount too low" },
    48401: { message: "Invalid signature" },
    54615: { message: "Insufficient balance" },
} as const

export const TonBolaVault_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "Not owner": 14534,
    "Nonce already used": 17091,
    "Jackpot below minimum": 35387,
    "Only owner": 35499,
    "Amount too low": 37002,
    "Invalid signature": 48401,
    "Insufficient balance": 54615,
} as const

const TonBolaVault_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"GamePayment","header":1198091632,"fields":[{"name":"game_type","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"game_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"player_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"PayWinner","header":1348565335,"fields":[{"name":"winner","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"game_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"nonce","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"signature","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"PayJackpot","header":1247896427,"fields":[{"name":"winner","type":{"kind":"simple","type":"address","optional":false}},{"name":"pool_id","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"nonce","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"signature","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"UpdateConfig","header":1131376230,"fields":[{"name":"dev_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"token_fund","type":{"kind":"simple","type":"address","optional":false}},{"name":"leaderboard_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"platform_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"oracle_pubkey","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"WinnerPaid","header":3287422055,"fields":[{"name":"winner","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"game_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"TonBolaVault$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"dev_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"token_fund","type":{"kind":"simple","type":"address","optional":false}},{"name":"leaderboard_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"platform_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"oracle_pubkey","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"last_nonce","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"jackpot_ton","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"total_in","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"total_paid","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"game_count","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"prize_pool","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
]

const TonBolaVault_opcodes = {
    "GamePayment": 1198091632,
    "PayWinner": 1348565335,
    "PayJackpot": 1247896427,
    "UpdateConfig": 1131376230,
    "WinnerPaid": 3287422055,
}

const TonBolaVault_getters: ABIGetter[] = [
    {"name":"balance","methodId":104128,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"prizePool","methodId":98797,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"jackpotTon","methodId":119911,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"totalIn","methodId":110700,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"totalPaid","methodId":125526,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"gameCount","methodId":102820,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"lastNonce","methodId":76140,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const TonBolaVault_getterMapping: { [key: string]: string } = {
    'balance': 'getBalance',
    'prizePool': 'getPrizePool',
    'jackpotTon': 'getJackpotTon',
    'totalIn': 'getTotalIn',
    'totalPaid': 'getTotalPaid',
    'gameCount': 'getGameCount',
    'lastNonce': 'getLastNonce',
    'owner': 'getOwner',
}

const TonBolaVault_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"GamePayment"}},
    {"receiver":"internal","message":{"kind":"typed","type":"PayWinner"}},
    {"receiver":"internal","message":{"kind":"typed","type":"PayJackpot"}},
    {"receiver":"internal","message":{"kind":"text","text":"add_jackpot"}},
    {"receiver":"internal","message":{"kind":"text","text":"add_liquidity"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UpdateConfig"}},
    {"receiver":"internal","message":{"kind":"text","text":"emergency_withdraw"}},
]


export class TonBolaVault implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = TonBolaVault_errors_backward;
    public static readonly opcodes = TonBolaVault_opcodes;
    
    static async init(dev_wallet: Address, token_fund: Address, leaderboard_wallet: Address, platform_wallet: Address, oracle_pubkey: bigint) {
        return await TonBolaVault_init(dev_wallet, token_fund, leaderboard_wallet, platform_wallet, oracle_pubkey);
    }
    
    static async fromInit(dev_wallet: Address, token_fund: Address, leaderboard_wallet: Address, platform_wallet: Address, oracle_pubkey: bigint) {
        const __gen_init = await TonBolaVault_init(dev_wallet, token_fund, leaderboard_wallet, platform_wallet, oracle_pubkey);
        const address = contractAddress(0, __gen_init);
        return new TonBolaVault(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new TonBolaVault(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  TonBolaVault_types,
        getters: TonBolaVault_getters,
        receivers: TonBolaVault_receivers,
        errors: TonBolaVault_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: GamePayment | PayWinner | PayJackpot | "add_jackpot" | "add_liquidity" | UpdateConfig | "emergency_withdraw") {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'GamePayment') {
            body = beginCell().store(storeGamePayment(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'PayWinner') {
            body = beginCell().store(storePayWinner(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'PayJackpot') {
            body = beginCell().store(storePayJackpot(message)).endCell();
        }
        if (message === "add_jackpot") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (message === "add_liquidity") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpdateConfig') {
            body = beginCell().store(storeUpdateConfig(message)).endCell();
        }
        if (message === "emergency_withdraw") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getBalance(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('balance', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getPrizePool(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('prizePool', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getJackpotTon(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('jackpotTon', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getTotalIn(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('totalIn', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getTotalPaid(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('totalPaid', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getGameCount(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('gameCount', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getLastNonce(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('lastNonce', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
}
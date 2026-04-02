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

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwner = {
    $$type: 'ChangeOwner';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwner(src: ChangeOwner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2174598809, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2174598809) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwner(source: ChangeOwner) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwner(): DictionaryValue<ChangeOwner> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwner(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwner(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwnerOk = {
    $$type: 'ChangeOwnerOk';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwnerOk(src: ChangeOwnerOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(846932810, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwnerOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 846932810) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwnerOk(source: ChangeOwnerOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwnerOk(): DictionaryValue<ChangeOwnerOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwnerOk(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwnerOk(src.loadRef().beginParse());
        }
    }
}

export type GamePayment = {
    $$type: 'GamePayment';
    game_type: bigint;
    game_id: bigint;
}

export function storeGamePayment(src: GamePayment) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1, 32);
        b_0.storeUint(src.game_type, 8);
        b_0.storeUint(src.game_id, 64);
    };
}

export function loadGamePayment(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1) { throw Error('Invalid prefix'); }
    const _game_type = sc_0.loadUintBig(8);
    const _game_id = sc_0.loadUintBig(64);
    return { $$type: 'GamePayment' as const, game_type: _game_type, game_id: _game_id };
}

export function loadTupleGamePayment(source: TupleReader) {
    const _game_type = source.readBigNumber();
    const _game_id = source.readBigNumber();
    return { $$type: 'GamePayment' as const, game_type: _game_type, game_id: _game_id };
}

export function loadGetterTupleGamePayment(source: TupleReader) {
    const _game_type = source.readBigNumber();
    const _game_id = source.readBigNumber();
    return { $$type: 'GamePayment' as const, game_type: _game_type, game_id: _game_id };
}

export function storeTupleGamePayment(source: GamePayment) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.game_type);
    builder.writeNumber(source.game_id);
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
    game_id: bigint;
    winner: Address;
    amount: bigint;
    win_type: bigint;
}

export function storePayWinner(src: PayWinner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2, 32);
        b_0.storeUint(src.game_id, 64);
        b_0.storeAddress(src.winner);
        b_0.storeCoins(src.amount);
        b_0.storeUint(src.win_type, 8);
    };
}

export function loadPayWinner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2) { throw Error('Invalid prefix'); }
    const _game_id = sc_0.loadUintBig(64);
    const _winner = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    const _win_type = sc_0.loadUintBig(8);
    return { $$type: 'PayWinner' as const, game_id: _game_id, winner: _winner, amount: _amount, win_type: _win_type };
}

export function loadTuplePayWinner(source: TupleReader) {
    const _game_id = source.readBigNumber();
    const _winner = source.readAddress();
    const _amount = source.readBigNumber();
    const _win_type = source.readBigNumber();
    return { $$type: 'PayWinner' as const, game_id: _game_id, winner: _winner, amount: _amount, win_type: _win_type };
}

export function loadGetterTuplePayWinner(source: TupleReader) {
    const _game_id = source.readBigNumber();
    const _winner = source.readAddress();
    const _amount = source.readBigNumber();
    const _win_type = source.readBigNumber();
    return { $$type: 'PayWinner' as const, game_id: _game_id, winner: _winner, amount: _amount, win_type: _win_type };
}

export function storeTuplePayWinner(source: PayWinner) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.game_id);
    builder.writeAddress(source.winner);
    builder.writeNumber(source.amount);
    builder.writeNumber(source.win_type);
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

export type PayRank = {
    $$type: 'PayRank';
    rank_type: bigint;
    period_key: bigint;
    w1: Address;
    a1: bigint;
    w2: Address;
    a2: bigint;
    w3: Address;
    a3: bigint;
    w4: Address;
    a4: bigint;
    w5: Address;
    a5: bigint;
}

export function storePayRank(src: PayRank) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3, 32);
        b_0.storeUint(src.rank_type, 8);
        b_0.storeUint(src.period_key, 64);
        b_0.storeAddress(src.w1);
        b_0.storeCoins(src.a1);
        b_0.storeAddress(src.w2);
        b_0.storeCoins(src.a2);
        const b_1 = new Builder();
        b_1.storeAddress(src.w3);
        b_1.storeCoins(src.a3);
        b_1.storeAddress(src.w4);
        b_1.storeCoins(src.a4);
        const b_2 = new Builder();
        b_2.storeAddress(src.w5);
        b_2.storeCoins(src.a5);
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadPayRank(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3) { throw Error('Invalid prefix'); }
    const _rank_type = sc_0.loadUintBig(8);
    const _period_key = sc_0.loadUintBig(64);
    const _w1 = sc_0.loadAddress();
    const _a1 = sc_0.loadCoins();
    const _w2 = sc_0.loadAddress();
    const _a2 = sc_0.loadCoins();
    const sc_1 = sc_0.loadRef().beginParse();
    const _w3 = sc_1.loadAddress();
    const _a3 = sc_1.loadCoins();
    const _w4 = sc_1.loadAddress();
    const _a4 = sc_1.loadCoins();
    const sc_2 = sc_1.loadRef().beginParse();
    const _w5 = sc_2.loadAddress();
    const _a5 = sc_2.loadCoins();
    return { $$type: 'PayRank' as const, rank_type: _rank_type, period_key: _period_key, w1: _w1, a1: _a1, w2: _w2, a2: _a2, w3: _w3, a3: _a3, w4: _w4, a4: _a4, w5: _w5, a5: _a5 };
}

export function loadTuplePayRank(source: TupleReader) {
    const _rank_type = source.readBigNumber();
    const _period_key = source.readBigNumber();
    const _w1 = source.readAddress();
    const _a1 = source.readBigNumber();
    const _w2 = source.readAddress();
    const _a2 = source.readBigNumber();
    const _w3 = source.readAddress();
    const _a3 = source.readBigNumber();
    const _w4 = source.readAddress();
    const _a4 = source.readBigNumber();
    const _w5 = source.readAddress();
    const _a5 = source.readBigNumber();
    return { $$type: 'PayRank' as const, rank_type: _rank_type, period_key: _period_key, w1: _w1, a1: _a1, w2: _w2, a2: _a2, w3: _w3, a3: _a3, w4: _w4, a4: _a4, w5: _w5, a5: _a5 };
}

export function loadGetterTuplePayRank(source: TupleReader) {
    const _rank_type = source.readBigNumber();
    const _period_key = source.readBigNumber();
    const _w1 = source.readAddress();
    const _a1 = source.readBigNumber();
    const _w2 = source.readAddress();
    const _a2 = source.readBigNumber();
    const _w3 = source.readAddress();
    const _a3 = source.readBigNumber();
    const _w4 = source.readAddress();
    const _a4 = source.readBigNumber();
    const _w5 = source.readAddress();
    const _a5 = source.readBigNumber();
    return { $$type: 'PayRank' as const, rank_type: _rank_type, period_key: _period_key, w1: _w1, a1: _a1, w2: _w2, a2: _a2, w3: _w3, a3: _a3, w4: _w4, a4: _a4, w5: _w5, a5: _a5 };
}

export function storeTuplePayRank(source: PayRank) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.rank_type);
    builder.writeNumber(source.period_key);
    builder.writeAddress(source.w1);
    builder.writeNumber(source.a1);
    builder.writeAddress(source.w2);
    builder.writeNumber(source.a2);
    builder.writeAddress(source.w3);
    builder.writeNumber(source.a3);
    builder.writeAddress(source.w4);
    builder.writeNumber(source.a4);
    builder.writeAddress(source.w5);
    builder.writeNumber(source.a5);
    return builder.build();
}

export function dictValueParserPayRank(): DictionaryValue<PayRank> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePayRank(src)).endCell());
        },
        parse: (src) => {
            return loadPayRank(src.loadRef().beginParse());
        }
    }
}

export type JackpotPayout = {
    $$type: 'JackpotPayout';
    game_type: bigint;
    winner: Address;
    amount: bigint;
}

export function storeJackpotPayout(src: JackpotPayout) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4, 32);
        b_0.storeUint(src.game_type, 8);
        b_0.storeAddress(src.winner);
        b_0.storeCoins(src.amount);
    };
}

export function loadJackpotPayout(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4) { throw Error('Invalid prefix'); }
    const _game_type = sc_0.loadUintBig(8);
    const _winner = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    return { $$type: 'JackpotPayout' as const, game_type: _game_type, winner: _winner, amount: _amount };
}

export function loadTupleJackpotPayout(source: TupleReader) {
    const _game_type = source.readBigNumber();
    const _winner = source.readAddress();
    const _amount = source.readBigNumber();
    return { $$type: 'JackpotPayout' as const, game_type: _game_type, winner: _winner, amount: _amount };
}

export function loadGetterTupleJackpotPayout(source: TupleReader) {
    const _game_type = source.readBigNumber();
    const _winner = source.readAddress();
    const _amount = source.readBigNumber();
    return { $$type: 'JackpotPayout' as const, game_type: _game_type, winner: _winner, amount: _amount };
}

export function storeTupleJackpotPayout(source: JackpotPayout) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.game_type);
    builder.writeAddress(source.winner);
    builder.writeNumber(source.amount);
    return builder.build();
}

export function dictValueParserJackpotPayout(): DictionaryValue<JackpotPayout> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJackpotPayout(src)).endCell());
        },
        parse: (src) => {
            return loadJackpotPayout(src.loadRef().beginParse());
        }
    }
}

export type SetOracle = {
    $$type: 'SetOracle';
    oracle: Address;
}

export function storeSetOracle(src: SetOracle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(5, 32);
        b_0.storeAddress(src.oracle);
    };
}

export function loadSetOracle(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 5) { throw Error('Invalid prefix'); }
    const _oracle = sc_0.loadAddress();
    return { $$type: 'SetOracle' as const, oracle: _oracle };
}

export function loadTupleSetOracle(source: TupleReader) {
    const _oracle = source.readAddress();
    return { $$type: 'SetOracle' as const, oracle: _oracle };
}

export function loadGetterTupleSetOracle(source: TupleReader) {
    const _oracle = source.readAddress();
    return { $$type: 'SetOracle' as const, oracle: _oracle };
}

export function storeTupleSetOracle(source: SetOracle) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.oracle);
    return builder.build();
}

export function dictValueParserSetOracle(): DictionaryValue<SetOracle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetOracle(src)).endCell());
        },
        parse: (src) => {
            return loadSetOracle(src.loadRef().beginParse());
        }
    }
}

export type WithdrawDev = {
    $$type: 'WithdrawDev';
    amount: bigint;
}

export function storeWithdrawDev(src: WithdrawDev) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(6, 32);
        b_0.storeCoins(src.amount);
    };
}

export function loadWithdrawDev(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 6) { throw Error('Invalid prefix'); }
    const _amount = sc_0.loadCoins();
    return { $$type: 'WithdrawDev' as const, amount: _amount };
}

export function loadTupleWithdrawDev(source: TupleReader) {
    const _amount = source.readBigNumber();
    return { $$type: 'WithdrawDev' as const, amount: _amount };
}

export function loadGetterTupleWithdrawDev(source: TupleReader) {
    const _amount = source.readBigNumber();
    return { $$type: 'WithdrawDev' as const, amount: _amount };
}

export function storeTupleWithdrawDev(source: WithdrawDev) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.amount);
    return builder.build();
}

export function dictValueParserWithdrawDev(): DictionaryValue<WithdrawDev> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeWithdrawDev(src)).endCell());
        },
        parse: (src) => {
            return loadWithdrawDev(src.loadRef().beginParse());
        }
    }
}

export type GamePool = {
    $$type: 'GamePool';
    amount: bigint;
    game_type: bigint;
    paid_out: boolean;
}

export function storeGamePool(src: GamePool) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.amount);
        b_0.storeUint(src.game_type, 8);
        b_0.storeBit(src.paid_out);
    };
}

export function loadGamePool(slice: Slice) {
    const sc_0 = slice;
    const _amount = sc_0.loadCoins();
    const _game_type = sc_0.loadUintBig(8);
    const _paid_out = sc_0.loadBit();
    return { $$type: 'GamePool' as const, amount: _amount, game_type: _game_type, paid_out: _paid_out };
}

export function loadTupleGamePool(source: TupleReader) {
    const _amount = source.readBigNumber();
    const _game_type = source.readBigNumber();
    const _paid_out = source.readBoolean();
    return { $$type: 'GamePool' as const, amount: _amount, game_type: _game_type, paid_out: _paid_out };
}

export function loadGetterTupleGamePool(source: TupleReader) {
    const _amount = source.readBigNumber();
    const _game_type = source.readBigNumber();
    const _paid_out = source.readBoolean();
    return { $$type: 'GamePool' as const, amount: _amount, game_type: _game_type, paid_out: _paid_out };
}

export function storeTupleGamePool(source: GamePool) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.amount);
    builder.writeNumber(source.game_type);
    builder.writeBoolean(source.paid_out);
    return builder.build();
}

export function dictValueParserGamePool(): DictionaryValue<GamePool> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeGamePool(src)).endCell());
        },
        parse: (src) => {
            return loadGamePool(src.loadRef().beginParse());
        }
    }
}

export type TonBolaVault$Data = {
    $$type: 'TonBolaVault$Data';
    owner: Address;
    oracle: Address;
    game_pools: Dictionary<bigint, GamePool>;
    jackpot_bingo: bigint;
    jackpot_wheel: bigint;
    jackpot_scratch: bigint;
    rank_weekly_ind: bigint;
    rank_monthly_ind: bigint;
    rank_weekly_squad: bigint;
    rank_monthly_squad: bigint;
    dev_balance: bigint;
    total_processed: bigint;
    paid_periods: Dictionary<bigint, boolean>;
}

export function storeTonBolaVault$Data(src: TonBolaVault$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.oracle);
        b_0.storeDict(src.game_pools, Dictionary.Keys.BigInt(257), dictValueParserGamePool());
        b_0.storeCoins(src.jackpot_bingo);
        b_0.storeCoins(src.jackpot_wheel);
        b_0.storeCoins(src.jackpot_scratch);
        const b_1 = new Builder();
        b_1.storeCoins(src.rank_weekly_ind);
        b_1.storeCoins(src.rank_monthly_ind);
        b_1.storeCoins(src.rank_weekly_squad);
        b_1.storeCoins(src.rank_monthly_squad);
        b_1.storeCoins(src.dev_balance);
        b_1.storeCoins(src.total_processed);
        b_1.storeDict(src.paid_periods, Dictionary.Keys.BigInt(257), Dictionary.Values.Bool());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadTonBolaVault$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _oracle = sc_0.loadAddress();
    const _game_pools = Dictionary.load(Dictionary.Keys.BigInt(257), dictValueParserGamePool(), sc_0);
    const _jackpot_bingo = sc_0.loadCoins();
    const _jackpot_wheel = sc_0.loadCoins();
    const _jackpot_scratch = sc_0.loadCoins();
    const sc_1 = sc_0.loadRef().beginParse();
    const _rank_weekly_ind = sc_1.loadCoins();
    const _rank_monthly_ind = sc_1.loadCoins();
    const _rank_weekly_squad = sc_1.loadCoins();
    const _rank_monthly_squad = sc_1.loadCoins();
    const _dev_balance = sc_1.loadCoins();
    const _total_processed = sc_1.loadCoins();
    const _paid_periods = Dictionary.load(Dictionary.Keys.BigInt(257), Dictionary.Values.Bool(), sc_1);
    return { $$type: 'TonBolaVault$Data' as const, owner: _owner, oracle: _oracle, game_pools: _game_pools, jackpot_bingo: _jackpot_bingo, jackpot_wheel: _jackpot_wheel, jackpot_scratch: _jackpot_scratch, rank_weekly_ind: _rank_weekly_ind, rank_monthly_ind: _rank_monthly_ind, rank_weekly_squad: _rank_weekly_squad, rank_monthly_squad: _rank_monthly_squad, dev_balance: _dev_balance, total_processed: _total_processed, paid_periods: _paid_periods };
}

export function loadTupleTonBolaVault$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _oracle = source.readAddress();
    const _game_pools = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserGamePool(), source.readCellOpt());
    const _jackpot_bingo = source.readBigNumber();
    const _jackpot_wheel = source.readBigNumber();
    const _jackpot_scratch = source.readBigNumber();
    const _rank_weekly_ind = source.readBigNumber();
    const _rank_monthly_ind = source.readBigNumber();
    const _rank_weekly_squad = source.readBigNumber();
    const _rank_monthly_squad = source.readBigNumber();
    const _dev_balance = source.readBigNumber();
    const _total_processed = source.readBigNumber();
    const _paid_periods = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Bool(), source.readCellOpt());
    return { $$type: 'TonBolaVault$Data' as const, owner: _owner, oracle: _oracle, game_pools: _game_pools, jackpot_bingo: _jackpot_bingo, jackpot_wheel: _jackpot_wheel, jackpot_scratch: _jackpot_scratch, rank_weekly_ind: _rank_weekly_ind, rank_monthly_ind: _rank_monthly_ind, rank_weekly_squad: _rank_weekly_squad, rank_monthly_squad: _rank_monthly_squad, dev_balance: _dev_balance, total_processed: _total_processed, paid_periods: _paid_periods };
}

export function loadGetterTupleTonBolaVault$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _oracle = source.readAddress();
    const _game_pools = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserGamePool(), source.readCellOpt());
    const _jackpot_bingo = source.readBigNumber();
    const _jackpot_wheel = source.readBigNumber();
    const _jackpot_scratch = source.readBigNumber();
    const _rank_weekly_ind = source.readBigNumber();
    const _rank_monthly_ind = source.readBigNumber();
    const _rank_weekly_squad = source.readBigNumber();
    const _rank_monthly_squad = source.readBigNumber();
    const _dev_balance = source.readBigNumber();
    const _total_processed = source.readBigNumber();
    const _paid_periods = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Bool(), source.readCellOpt());
    return { $$type: 'TonBolaVault$Data' as const, owner: _owner, oracle: _oracle, game_pools: _game_pools, jackpot_bingo: _jackpot_bingo, jackpot_wheel: _jackpot_wheel, jackpot_scratch: _jackpot_scratch, rank_weekly_ind: _rank_weekly_ind, rank_monthly_ind: _rank_monthly_ind, rank_weekly_squad: _rank_weekly_squad, rank_monthly_squad: _rank_monthly_squad, dev_balance: _dev_balance, total_processed: _total_processed, paid_periods: _paid_periods };
}

export function storeTupleTonBolaVault$Data(source: TonBolaVault$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.oracle);
    builder.writeCell(source.game_pools.size > 0 ? beginCell().storeDictDirect(source.game_pools, Dictionary.Keys.BigInt(257), dictValueParserGamePool()).endCell() : null);
    builder.writeNumber(source.jackpot_bingo);
    builder.writeNumber(source.jackpot_wheel);
    builder.writeNumber(source.jackpot_scratch);
    builder.writeNumber(source.rank_weekly_ind);
    builder.writeNumber(source.rank_monthly_ind);
    builder.writeNumber(source.rank_weekly_squad);
    builder.writeNumber(source.rank_monthly_squad);
    builder.writeNumber(source.dev_balance);
    builder.writeNumber(source.total_processed);
    builder.writeCell(source.paid_periods.size > 0 ? beginCell().storeDictDirect(source.paid_periods, Dictionary.Keys.BigInt(257), Dictionary.Values.Bool()).endCell() : null);
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
    owner: Address;
    oracle: Address;
}

function initTonBolaVault_init_args(src: TonBolaVault_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.oracle);
    };
}

async function TonBolaVault_init(owner: Address, oracle: Address) {
    const __code = Cell.fromHex('b5ee9c7241024501000d8f000228ff008e88f4a413f4bcf2c80bed5320e303ed43d90127020271021c020120030e0201200409020120050701a1b248bb5134348000638b3e903e903d013e803e803e803500743e803e803e803e803e803e803d010c041f441f041ec41e841e441e1b076384fe903e901640b4405b5c151c00151c0014c01b78b6cf1b34600600022101a1b27e7b5134348000638b3e903e903d013e803e803e803500743e803e803e803e803e803e803d010c041f441f041ec41e841e441e1b076384fe903e901640b4405b5c151c00151c0014c01b78b6cf1b3460080002250201480a0c01a1ae0876a268690000c7167d207d207a027d007d007d006a00e87d007d007d007d007d007d007a0218083e883e083d883d083c883c360ec709fd207d202c816880b6b82a38002a3800298036f16d9e3668c00b00022901a1ad0576a268690000c7167d207d207a027d007d007d006a00e87d007d007d007d007d007d007a0218083e883e083d883d083c883c360ec709fd207d202c816880b6b82a38002a3800298036f16d9e3668c00d0002230201200f1a02012010150201661113019fa63bda89a1a400031c59f481f481e809f401f401f401a803a1f401f401f401f401f401f401e8086020fa20f820f620f420f220f0d83b1c27f481f480b205a202dae0a8e000a8e000a600dbc5b678d9a31200022c019fa445da89a1a400031c59f481f481e809f401f401f401a803a1f401f401f401f401f401f401e8086020fa20f820f620f420f220f0d83b1c27f481f480b205a202dae0a8e000a8e000a600dbc5b678d9a314000224020120161801a5af4c76a268690000c7167d207d207a027d007d007d006a00e87d007d007d007d007d007d007a0218083e883e083d883d083c883c360ec709fd207d202c816880b6b82a38002a3800298036f12a866d9e3668c01700608101012c0259f40d6fa192306ddf206e92306d9dd0fa00d307d20055206c136f03e2206e923070e0206ef2d0806f235b01a1ae03f6a268690000c7167d207d207a027d007d007d006a00e87d007d007d007d007d007d007a0218083e883e083d883d083c883c360ec709fd207d202c816880b6b82a38002a3800298036f16d9e3668c01900022b01a1b734dda89a1a400031c59f481f481e809f401f401f401a803a1f401f401f401f401f401f401e8086020fa20f820f620f420f220f0d83b1c27f481f480b205a202dae0a8e000a8e000a600dbc5b678d9a301b0002270201201d220201201e2001a1b6d81da89a1a400031c59f481f481e809f401f401f401a803a1f401f401f401f401f401f401e8086020fa20f820f620f420f220f0d83b1c27f481f480b205a202dae0a8e000a8e000a600dbc5b678d9a301f0008f8276f1001a1b4275da89a1a400031c59f481f481e809f401f401f401a803a1f401f401f401f401f401f401e8086020fa20f820f620f420f220f0d83b1c27f481f480b205a202dae0a8e000a8e000a600dbc5b678d9a3021000222020166232501a1adacf6a268690000c7167d207d207a027d007d007d006a00e87d007d007d007d007d007d007a0218083e883e083d883d083c883c360ec709fd207d202c816880b6b82a38002a3800298036f16d9e3668c02400022801a1ae2d76a268690000c7167d207d207a027d007d007d006a00e87d007d007d007d007d007d007a0218083e883e083d883d083c883c360ec709fd207d202c816880b6b82a38002a3800298036f16d9e3668c02600022603f63001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e2cfa40fa40f404fa00fa00fa00d401d0fa00fa00fa00fa00fa00fa00f40430107d107c107b107a107910786c1d8e13fa40fa405902d1016d7054700054700053006de20e925f0ee00cd70d1ff2e08221c001e30221c002e30221c004282c3001d831d307d33f30f8416f24135f038200b8ba218208989680bef2f42081157ca8812710a904218101f4a8812710a90422810096a8812710a90423a764812710a90424a764812710a90425a732812710a9045365a125a124a123a122a121a156128101012a59f40d6fa192306ddf2902fe206e92306d9dd0fa00d307d20055206c136f03e2206eb38e2f206ef2d0806f235b81010108a02a70c855205afa0212cb07ca00c9031113034790206e953059f45a30944133f415e28e2730810101517a70c855205afa0212cb07ca00c9031113034790206e953059f45a30944133f415e2e227963750e2a00d0ce30d50aca02a2b001c07c0019350d2a09550c2a00b0ce200ac5089a0506ca05046a05023a050c3a010ac109b109a10791068105710461045500304c87f01ca0055c050cdce1ace18f4005006fa025004fa0258fa02c858fa0258fa0258fa0258fa0258fa0258fa0212f400cdc9ed5401fc31d33ffa40fa00d30730817322f8422fc705f2f42c8101012559f40d6fa192306ddf206e92306d9dd0fa00d307d20055206c136f03e2812f0b216eb3f2f4206ef2d0806f23812b1201b3f2f48142a624c200935342bb9170e2f2f48147a7f8276f1025a182100bebc200bef2f422c00192327f9302c002e28101015124a12d02c04033c855205afa0212cb07ca00c9103d4140206e953059f45a30944133f415e27188103c102c5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010ac55192e2f002200000000546f6e426f6c61207072697a650068c87f01ca0055c050cdce1ace18f4005006fa025004fa0258fa02c858fa0258fa0258fa0258fa0258fa0258fa0212f400cdc9ed5404c6e30221c003e30221c0058ed331fa403010bc10ab109a108910781067105610451034413ddb3c3b10bc5509c87f01ca0055c050cdce1ace18f4005006fa025004fa0258fa02c858fa0258fa0258fa0258fa0258fa0258fa0212f400cdc9ed54e021c0063134413f02fe31d307fa40fa0030817322f8422ec705f2f4228e2602c0019e811b832982112a05f200bef2f4708e11811b832882112a05f200bef2f410787008e28e1132811b832a82112a05f200bef2f4700a09e2228200a6ad0bbb1af2f48147a7f8276f1023a182100bebc200bef2f4718810235a6d6d40037fc8cf8580ca00cf8440ce3233002600000000546f6e426f6c61206a61636b706f7400bc01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010ac5519c87f01ca0055c050cdce1ace18f4005006fa025004fa0258fa02c858fa0258fa0258fa0258fa0258fa0258fa0212f400cdc9ed5402fe31d307d33ffa40fa00fa40fa00d430d0fa40fa00fa40fa00d430d0fa40fa0030817322f8425617c705f2f456188101012c714133f40c6fa19401d70030925b6de2815547216e92317f9701206ef2d080b3e2f2f401111801810101500b7f71216e955b59f45a3098c801cf004133f442e22a943a700f0ee30d8121842fc2003536002a2ac001923a709d0ac00291709410bc700ce20d0ee203faf2f45375a024a022a02aa0208110371111bb01111001f2f48147a7f8276f10011110a182100bebc200be1ff2f426c2008ebc7188103910285a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00923636e222c200926c22e30d20c20037383a002400000000546f6e426f6c612072616e6b203101787188103510245a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0039002400000000546f6e426f6c612072616e6b203203fc8eb871885a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00915be220c2008eb871885a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00915be2203b3c3d002400000000546f6e426f6c612072616e6b2033002400000000546f6e426f6c612072616e6b203401f8c2008ebc7188031110035a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0092303de210ac5519c87f01ca0055c050cdce1ace18f4005006fa025004fa0258fa02c858fa0258fa0258fa0258fa0258fa0258fa0212f400cdc9ed543e002400000000546f6e426f6c612072616e6b20350222e302018210946a98b6bae3025f0ef2c082404403fc31fa003010bc10ab109a108910781067105610451034413ddb3c8137ef53e3bbf2f48147a7f8276f102fa182100bebc200bef2f4512da171882e031110595a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010bc10ab109a108910784142430010f8422dc705f2e084002400000000446576207769746864726177616c007c10671056104510344300c87f01ca0055c050cdce1ace18f4005006fa025004fa0258fa02c858fa0258fa0258fa0258fa0258fa0258fa0212f400cdc9ed5400f8d33f30c8018210aff90f5758cb1fcb3fc910bd10ac109b108a107910681057104610354430f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055c050cdce1ace18f4005006fa025004fa0258fa02c858fa0258fa0258fa0258fa0258fa0258fa0212f400cdc9ed54e7dd9900');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initTonBolaVault_init_args({ $$type: 'TonBolaVault_init_args', owner, oracle })(builder);
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
    4151: { message: "Exceeds pool" },
    7043: { message: "Below 5 TON threshold" },
    8580: { message: "Empty pool" },
    11026: { message: "Already paid" },
    12043: { message: "Pool not found" },
    14319: { message: "Exceeds dev balance" },
    17062: { message: "Invalid amount" },
    18343: { message: "Low balance" },
    21831: { message: "Period already paid" },
    29474: { message: "Only oracle" },
    42669: { message: "Exceeds jackpot" },
    47290: { message: "Min 0.01 TON" },
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
    "Exceeds pool": 4151,
    "Below 5 TON threshold": 7043,
    "Empty pool": 8580,
    "Already paid": 11026,
    "Pool not found": 12043,
    "Exceeds dev balance": 14319,
    "Invalid amount": 17062,
    "Low balance": 18343,
    "Period already paid": 21831,
    "Only oracle": 29474,
    "Exceeds jackpot": 42669,
    "Min 0.01 TON": 47290,
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
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ChangeOwner","header":2174598809,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ChangeOwnerOk","header":846932810,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"GamePayment","header":1,"fields":[{"name":"game_type","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"game_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"PayWinner","header":2,"fields":[{"name":"game_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"winner","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"win_type","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"PayRank","header":3,"fields":[{"name":"rank_type","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"period_key","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"w1","type":{"kind":"simple","type":"address","optional":false}},{"name":"a1","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"w2","type":{"kind":"simple","type":"address","optional":false}},{"name":"a2","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"w3","type":{"kind":"simple","type":"address","optional":false}},{"name":"a3","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"w4","type":{"kind":"simple","type":"address","optional":false}},{"name":"a4","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"w5","type":{"kind":"simple","type":"address","optional":false}},{"name":"a5","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"JackpotPayout","header":4,"fields":[{"name":"game_type","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"winner","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"SetOracle","header":5,"fields":[{"name":"oracle","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"WithdrawDev","header":6,"fields":[{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"GamePool","header":null,"fields":[{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"game_type","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"paid_out","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"TonBolaVault$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"oracle","type":{"kind":"simple","type":"address","optional":false}},{"name":"game_pools","type":{"kind":"dict","key":"int","value":"GamePool","valueFormat":"ref"}},{"name":"jackpot_bingo","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"jackpot_wheel","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"jackpot_scratch","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"rank_weekly_ind","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"rank_monthly_ind","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"rank_weekly_squad","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"rank_monthly_squad","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"dev_balance","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"total_processed","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"paid_periods","type":{"kind":"dict","key":"int","value":"bool"}}]},
]

const TonBolaVault_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "ChangeOwner": 2174598809,
    "ChangeOwnerOk": 846932810,
    "GamePayment": 1,
    "PayWinner": 2,
    "PayRank": 3,
    "JackpotPayout": 4,
    "SetOracle": 5,
    "WithdrawDev": 6,
}

const TonBolaVault_getters: ABIGetter[] = [
    {"name":"getPool","methodId":87704,"arguments":[{"name":"game_id","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"jackpotBingo","methodId":74768,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"jackpotWheel","methodId":119641,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"jackpotScratch","methodId":96678,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"rankWeeklyInd","methodId":121946,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"rankMonthlyInd","methodId":72185,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"rankWeeklySquad","methodId":83490,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"rankMonthlySquad","methodId":76298,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"devBalance","methodId":106810,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"totalProcessed","methodId":67874,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"oracle","methodId":89095,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"balance","methodId":104128,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const TonBolaVault_getterMapping: { [key: string]: string } = {
    'getPool': 'getGetPool',
    'jackpotBingo': 'getJackpotBingo',
    'jackpotWheel': 'getJackpotWheel',
    'jackpotScratch': 'getJackpotScratch',
    'rankWeeklyInd': 'getRankWeeklyInd',
    'rankMonthlyInd': 'getRankMonthlyInd',
    'rankWeeklySquad': 'getRankWeeklySquad',
    'rankMonthlySquad': 'getRankMonthlySquad',
    'devBalance': 'getDevBalance',
    'totalProcessed': 'getTotalProcessed',
    'oracle': 'getOracle',
    'balance': 'getBalance',
    'owner': 'getOwner',
}

const TonBolaVault_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"GamePayment"}},
    {"receiver":"internal","message":{"kind":"typed","type":"PayWinner"}},
    {"receiver":"internal","message":{"kind":"typed","type":"JackpotPayout"}},
    {"receiver":"internal","message":{"kind":"typed","type":"PayRank"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetOracle"}},
    {"receiver":"internal","message":{"kind":"typed","type":"WithdrawDev"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deploy"}},
]


export class TonBolaVault implements Contract {
    
    public static readonly BP_PRIZE = 5500n;
    public static readonly BP_JACKPOT = 500n;
    public static readonly BP_RANK_WEEKLY_I = 150n;
    public static readonly BP_RANK_MONTHLY_I = 100n;
    public static readonly BP_RANK_WEEKLY_S = 100n;
    public static readonly BP_RANK_MONTHLY_S = 50n;
    public static readonly JACKPOT_MIN = 5000000000n;
    public static readonly MIN_BALANCE = 200000000n;
    public static readonly storageReserve = 0n;
    public static readonly errors = TonBolaVault_errors_backward;
    public static readonly opcodes = TonBolaVault_opcodes;
    
    static async init(owner: Address, oracle: Address) {
        return await TonBolaVault_init(owner, oracle);
    }
    
    static async fromInit(owner: Address, oracle: Address) {
        const __gen_init = await TonBolaVault_init(owner, oracle);
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
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: GamePayment | PayWinner | JackpotPayout | PayRank | SetOracle | WithdrawDev | Deploy) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'GamePayment') {
            body = beginCell().store(storeGamePayment(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'PayWinner') {
            body = beginCell().store(storePayWinner(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JackpotPayout') {
            body = beginCell().store(storeJackpotPayout(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'PayRank') {
            body = beginCell().store(storePayRank(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetOracle') {
            body = beginCell().store(storeSetOracle(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'WithdrawDev') {
            body = beginCell().store(storeWithdrawDev(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetPool(provider: ContractProvider, game_id: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(game_id);
        const source = (await provider.get('getPool', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getJackpotBingo(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('jackpotBingo', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getJackpotWheel(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('jackpotWheel', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getJackpotScratch(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('jackpotScratch', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getRankWeeklyInd(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('rankWeeklyInd', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getRankMonthlyInd(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('rankMonthlyInd', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getRankWeeklySquad(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('rankWeeklySquad', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getRankMonthlySquad(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('rankMonthlySquad', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getDevBalance(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('devBalance', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getTotalProcessed(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('totalProcessed', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getOracle(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('oracle', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getBalance(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('balance', builder.build())).stack;
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
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

export type Transfer = {
    $$type: 'Transfer';
    query_id: bigint;
    amount: bigint;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell | null;
    forward_ton_amount: bigint;
    forward_payload: Slice;
}

export function storeTransfer(src: Transfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(260734629, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.destination);
        b_0.storeAddress(src.response_destination);
        if (src.custom_payload !== null && src.custom_payload !== undefined) { b_0.storeBit(true).storeRef(src.custom_payload); } else { b_0.storeBit(false); }
        b_0.storeCoins(src.forward_ton_amount);
        b_0.storeBuilder(src.forward_payload.asBuilder());
    };
}

export function loadTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 260734629) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _destination = sc_0.loadAddress();
    const _response_destination = sc_0.loadAddress();
    const _custom_payload = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _forward_ton_amount = sc_0.loadCoins();
    const _forward_payload = sc_0;
    return { $$type: 'Transfer' as const, query_id: _query_id, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadTupleTransfer(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _response_destination = source.readAddress();
    const _custom_payload = source.readCellOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'Transfer' as const, query_id: _query_id, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadGetterTupleTransfer(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _response_destination = source.readAddress();
    const _custom_payload = source.readCellOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'Transfer' as const, query_id: _query_id, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function storeTupleTransfer(source: Transfer) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.destination);
    builder.writeAddress(source.response_destination);
    builder.writeCell(source.custom_payload);
    builder.writeNumber(source.forward_ton_amount);
    builder.writeSlice(source.forward_payload.asCell());
    return builder.build();
}

export function dictValueParserTransfer(): DictionaryValue<Transfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadTransfer(src.loadRef().beginParse());
        }
    }
}

export type TransferNotification = {
    $$type: 'TransferNotification';
    query_id: bigint;
    amount: bigint;
    sender: Address;
    forward_payload: Slice;
}

export function storeTransferNotification(src: TransferNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(395134233, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeBuilder(src.forward_payload.asBuilder());
    };
}

export function loadTransferNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 395134233) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _forward_payload = sc_0;
    return { $$type: 'TransferNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function loadTupleTransferNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'TransferNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function loadGetterTupleTransferNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'TransferNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function storeTupleTransferNotification(source: TransferNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeSlice(source.forward_payload.asCell());
    return builder.build();
}

export function dictValueParserTransferNotification(): DictionaryValue<TransferNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTransferNotification(src)).endCell());
        },
        parse: (src) => {
            return loadTransferNotification(src.loadRef().beginParse());
        }
    }
}

export type Burn = {
    $$type: 'Burn';
    query_id: bigint;
    amount: bigint;
    response_destination: Address;
    custom_payload: Cell | null;
}

export function storeBurn(src: Burn) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1499400124, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.response_destination);
        if (src.custom_payload !== null && src.custom_payload !== undefined) { b_0.storeBit(true).storeRef(src.custom_payload); } else { b_0.storeBit(false); }
    };
}

export function loadBurn(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1499400124) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _response_destination = sc_0.loadAddress();
    const _custom_payload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'Burn' as const, query_id: _query_id, amount: _amount, response_destination: _response_destination, custom_payload: _custom_payload };
}

export function loadTupleBurn(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _response_destination = source.readAddress();
    const _custom_payload = source.readCellOpt();
    return { $$type: 'Burn' as const, query_id: _query_id, amount: _amount, response_destination: _response_destination, custom_payload: _custom_payload };
}

export function loadGetterTupleBurn(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _response_destination = source.readAddress();
    const _custom_payload = source.readCellOpt();
    return { $$type: 'Burn' as const, query_id: _query_id, amount: _amount, response_destination: _response_destination, custom_payload: _custom_payload };
}

export function storeTupleBurn(source: Burn) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.response_destination);
    builder.writeCell(source.custom_payload);
    return builder.build();
}

export function dictValueParserBurn(): DictionaryValue<Burn> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBurn(src)).endCell());
        },
        parse: (src) => {
            return loadBurn(src.loadRef().beginParse());
        }
    }
}

export type BurnNotification = {
    $$type: 'BurnNotification';
    query_id: bigint;
    amount: bigint;
    sender: Address;
    response_destination: Address;
}

export function storeBurnNotification(src: BurnNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2078119902, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeAddress(src.response_destination);
    };
}

export function loadBurnNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2078119902) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _response_destination = sc_0.loadAddress();
    return { $$type: 'BurnNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, response_destination: _response_destination };
}

export function loadTupleBurnNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _response_destination = source.readAddress();
    return { $$type: 'BurnNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, response_destination: _response_destination };
}

export function loadGetterTupleBurnNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _response_destination = source.readAddress();
    return { $$type: 'BurnNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, response_destination: _response_destination };
}

export function storeTupleBurnNotification(source: BurnNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeAddress(source.response_destination);
    return builder.build();
}

export function dictValueParserBurnNotification(): DictionaryValue<BurnNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBurnNotification(src)).endCell());
        },
        parse: (src) => {
            return loadBurnNotification(src.loadRef().beginParse());
        }
    }
}

export type Excesses = {
    $$type: 'Excesses';
    query_id: bigint;
}

export function storeExcesses(src: Excesses) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3576854235, 32);
        b_0.storeUint(src.query_id, 64);
    };
}

export function loadExcesses(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3576854235) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    return { $$type: 'Excesses' as const, query_id: _query_id };
}

export function loadTupleExcesses(source: TupleReader) {
    const _query_id = source.readBigNumber();
    return { $$type: 'Excesses' as const, query_id: _query_id };
}

export function loadGetterTupleExcesses(source: TupleReader) {
    const _query_id = source.readBigNumber();
    return { $$type: 'Excesses' as const, query_id: _query_id };
}

export function storeTupleExcesses(source: Excesses) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    return builder.build();
}

export function dictValueParserExcesses(): DictionaryValue<Excesses> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeExcesses(src)).endCell());
        },
        parse: (src) => {
            return loadExcesses(src.loadRef().beginParse());
        }
    }
}

export type ProvideWalletAddress = {
    $$type: 'ProvideWalletAddress';
    query_id: bigint;
    owner_address: Address;
    include_address: boolean;
}

export function storeProvideWalletAddress(src: ProvideWalletAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(745978227, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeAddress(src.owner_address);
        b_0.storeBit(src.include_address);
    };
}

export function loadProvideWalletAddress(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 745978227) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _owner_address = sc_0.loadAddress();
    const _include_address = sc_0.loadBit();
    return { $$type: 'ProvideWalletAddress' as const, query_id: _query_id, owner_address: _owner_address, include_address: _include_address };
}

export function loadTupleProvideWalletAddress(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _owner_address = source.readAddress();
    const _include_address = source.readBoolean();
    return { $$type: 'ProvideWalletAddress' as const, query_id: _query_id, owner_address: _owner_address, include_address: _include_address };
}

export function loadGetterTupleProvideWalletAddress(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _owner_address = source.readAddress();
    const _include_address = source.readBoolean();
    return { $$type: 'ProvideWalletAddress' as const, query_id: _query_id, owner_address: _owner_address, include_address: _include_address };
}

export function storeTupleProvideWalletAddress(source: ProvideWalletAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeAddress(source.owner_address);
    builder.writeBoolean(source.include_address);
    return builder.build();
}

export function dictValueParserProvideWalletAddress(): DictionaryValue<ProvideWalletAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeProvideWalletAddress(src)).endCell());
        },
        parse: (src) => {
            return loadProvideWalletAddress(src.loadRef().beginParse());
        }
    }
}

export type TakeWalletAddress = {
    $$type: 'TakeWalletAddress';
    query_id: bigint;
    wallet_address: Address;
    owner_address: Address | null;
}

export function storeTakeWalletAddress(src: TakeWalletAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3513996288, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeAddress(src.wallet_address);
        b_0.storeAddress(src.owner_address);
    };
}

export function loadTakeWalletAddress(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3513996288) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _wallet_address = sc_0.loadAddress();
    const _owner_address = sc_0.loadMaybeAddress();
    return { $$type: 'TakeWalletAddress' as const, query_id: _query_id, wallet_address: _wallet_address, owner_address: _owner_address };
}

export function loadTupleTakeWalletAddress(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _wallet_address = source.readAddress();
    const _owner_address = source.readAddressOpt();
    return { $$type: 'TakeWalletAddress' as const, query_id: _query_id, wallet_address: _wallet_address, owner_address: _owner_address };
}

export function loadGetterTupleTakeWalletAddress(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _wallet_address = source.readAddress();
    const _owner_address = source.readAddressOpt();
    return { $$type: 'TakeWalletAddress' as const, query_id: _query_id, wallet_address: _wallet_address, owner_address: _owner_address };
}

export function storeTupleTakeWalletAddress(source: TakeWalletAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeAddress(source.wallet_address);
    builder.writeAddress(source.owner_address);
    return builder.build();
}

export function dictValueParserTakeWalletAddress(): DictionaryValue<TakeWalletAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTakeWalletAddress(src)).endCell());
        },
        parse: (src) => {
            return loadTakeWalletAddress(src.loadRef().beginParse());
        }
    }
}

export type Mint = {
    $$type: 'Mint';
    query_id: bigint;
    amount: bigint;
    receiver: Address;
}

export function storeMint(src: Mint) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1680571655, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.receiver);
    };
}

export function loadMint(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1680571655) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _receiver = sc_0.loadAddress();
    return { $$type: 'Mint' as const, query_id: _query_id, amount: _amount, receiver: _receiver };
}

export function loadTupleMint(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _receiver = source.readAddress();
    return { $$type: 'Mint' as const, query_id: _query_id, amount: _amount, receiver: _receiver };
}

export function loadGetterTupleMint(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _receiver = source.readAddress();
    return { $$type: 'Mint' as const, query_id: _query_id, amount: _amount, receiver: _receiver };
}

export function storeTupleMint(source: Mint) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.receiver);
    return builder.build();
}

export function dictValueParserMint(): DictionaryValue<Mint> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMint(src)).endCell());
        },
        parse: (src) => {
            return loadMint(src.loadRef().beginParse());
        }
    }
}

export type TbolaWallet$Data = {
    $$type: 'TbolaWallet$Data';
    balance: bigint;
    owner: Address;
    jetton_master: Address;
}

export function storeTbolaWallet$Data(src: TbolaWallet$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.balance);
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.jetton_master);
    };
}

export function loadTbolaWallet$Data(slice: Slice) {
    const sc_0 = slice;
    const _balance = sc_0.loadCoins();
    const _owner = sc_0.loadAddress();
    const _jetton_master = sc_0.loadAddress();
    return { $$type: 'TbolaWallet$Data' as const, balance: _balance, owner: _owner, jetton_master: _jetton_master };
}

export function loadTupleTbolaWallet$Data(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _jetton_master = source.readAddress();
    return { $$type: 'TbolaWallet$Data' as const, balance: _balance, owner: _owner, jetton_master: _jetton_master };
}

export function loadGetterTupleTbolaWallet$Data(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _jetton_master = source.readAddress();
    return { $$type: 'TbolaWallet$Data' as const, balance: _balance, owner: _owner, jetton_master: _jetton_master };
}

export function storeTupleTbolaWallet$Data(source: TbolaWallet$Data) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.balance);
    builder.writeAddress(source.owner);
    builder.writeAddress(source.jetton_master);
    return builder.build();
}

export function dictValueParserTbolaWallet$Data(): DictionaryValue<TbolaWallet$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTbolaWallet$Data(src)).endCell());
        },
        parse: (src) => {
            return loadTbolaWallet$Data(src.loadRef().beginParse());
        }
    }
}

export type TbolaJetton$Data = {
    $$type: 'TbolaJetton$Data';
    total_supply: bigint;
    mintable: boolean;
    owner: Address;
    minted_airdrop: bigint;
    minted_presale: bigint;
    minted_liquidity: bigint;
    minted_team: bigint;
    minted_marketing: bigint;
    minted_reserve: bigint;
    presale_wallet: Address;
    liquidity_wallet: Address;
    team_wallet: Address;
    marketing_wallet: Address;
    reserve_wallet: Address;
    team_vesting_start: bigint;
    team_vesting_claimed: bigint;
}

export function storeTbolaJetton$Data(src: TbolaJetton$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.total_supply);
        b_0.storeBit(src.mintable);
        b_0.storeAddress(src.owner);
        b_0.storeCoins(src.minted_airdrop);
        b_0.storeCoins(src.minted_presale);
        b_0.storeCoins(src.minted_liquidity);
        b_0.storeCoins(src.minted_team);
        b_0.storeCoins(src.minted_marketing);
        const b_1 = new Builder();
        b_1.storeCoins(src.minted_reserve);
        b_1.storeAddress(src.presale_wallet);
        b_1.storeAddress(src.liquidity_wallet);
        b_1.storeAddress(src.team_wallet);
        const b_2 = new Builder();
        b_2.storeAddress(src.marketing_wallet);
        b_2.storeAddress(src.reserve_wallet);
        b_2.storeUint(src.team_vesting_start, 32);
        b_2.storeCoins(src.team_vesting_claimed);
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadTbolaJetton$Data(slice: Slice) {
    const sc_0 = slice;
    const _total_supply = sc_0.loadCoins();
    const _mintable = sc_0.loadBit();
    const _owner = sc_0.loadAddress();
    const _minted_airdrop = sc_0.loadCoins();
    const _minted_presale = sc_0.loadCoins();
    const _minted_liquidity = sc_0.loadCoins();
    const _minted_team = sc_0.loadCoins();
    const _minted_marketing = sc_0.loadCoins();
    const sc_1 = sc_0.loadRef().beginParse();
    const _minted_reserve = sc_1.loadCoins();
    const _presale_wallet = sc_1.loadAddress();
    const _liquidity_wallet = sc_1.loadAddress();
    const _team_wallet = sc_1.loadAddress();
    const sc_2 = sc_1.loadRef().beginParse();
    const _marketing_wallet = sc_2.loadAddress();
    const _reserve_wallet = sc_2.loadAddress();
    const _team_vesting_start = sc_2.loadUintBig(32);
    const _team_vesting_claimed = sc_2.loadCoins();
    return { $$type: 'TbolaJetton$Data' as const, total_supply: _total_supply, mintable: _mintable, owner: _owner, minted_airdrop: _minted_airdrop, minted_presale: _minted_presale, minted_liquidity: _minted_liquidity, minted_team: _minted_team, minted_marketing: _minted_marketing, minted_reserve: _minted_reserve, presale_wallet: _presale_wallet, liquidity_wallet: _liquidity_wallet, team_wallet: _team_wallet, marketing_wallet: _marketing_wallet, reserve_wallet: _reserve_wallet, team_vesting_start: _team_vesting_start, team_vesting_claimed: _team_vesting_claimed };
}

export function loadTupleTbolaJetton$Data(source: TupleReader) {
    const _total_supply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _owner = source.readAddress();
    const _minted_airdrop = source.readBigNumber();
    const _minted_presale = source.readBigNumber();
    const _minted_liquidity = source.readBigNumber();
    const _minted_team = source.readBigNumber();
    const _minted_marketing = source.readBigNumber();
    const _minted_reserve = source.readBigNumber();
    const _presale_wallet = source.readAddress();
    const _liquidity_wallet = source.readAddress();
    const _team_wallet = source.readAddress();
    const _marketing_wallet = source.readAddress();
    const _reserve_wallet = source.readAddress();
    source = source.readTuple();
    const _team_vesting_start = source.readBigNumber();
    const _team_vesting_claimed = source.readBigNumber();
    return { $$type: 'TbolaJetton$Data' as const, total_supply: _total_supply, mintable: _mintable, owner: _owner, minted_airdrop: _minted_airdrop, minted_presale: _minted_presale, minted_liquidity: _minted_liquidity, minted_team: _minted_team, minted_marketing: _minted_marketing, minted_reserve: _minted_reserve, presale_wallet: _presale_wallet, liquidity_wallet: _liquidity_wallet, team_wallet: _team_wallet, marketing_wallet: _marketing_wallet, reserve_wallet: _reserve_wallet, team_vesting_start: _team_vesting_start, team_vesting_claimed: _team_vesting_claimed };
}

export function loadGetterTupleTbolaJetton$Data(source: TupleReader) {
    const _total_supply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _owner = source.readAddress();
    const _minted_airdrop = source.readBigNumber();
    const _minted_presale = source.readBigNumber();
    const _minted_liquidity = source.readBigNumber();
    const _minted_team = source.readBigNumber();
    const _minted_marketing = source.readBigNumber();
    const _minted_reserve = source.readBigNumber();
    const _presale_wallet = source.readAddress();
    const _liquidity_wallet = source.readAddress();
    const _team_wallet = source.readAddress();
    const _marketing_wallet = source.readAddress();
    const _reserve_wallet = source.readAddress();
    const _team_vesting_start = source.readBigNumber();
    const _team_vesting_claimed = source.readBigNumber();
    return { $$type: 'TbolaJetton$Data' as const, total_supply: _total_supply, mintable: _mintable, owner: _owner, minted_airdrop: _minted_airdrop, minted_presale: _minted_presale, minted_liquidity: _minted_liquidity, minted_team: _minted_team, minted_marketing: _minted_marketing, minted_reserve: _minted_reserve, presale_wallet: _presale_wallet, liquidity_wallet: _liquidity_wallet, team_wallet: _team_wallet, marketing_wallet: _marketing_wallet, reserve_wallet: _reserve_wallet, team_vesting_start: _team_vesting_start, team_vesting_claimed: _team_vesting_claimed };
}

export function storeTupleTbolaJetton$Data(source: TbolaJetton$Data) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.total_supply);
    builder.writeBoolean(source.mintable);
    builder.writeAddress(source.owner);
    builder.writeNumber(source.minted_airdrop);
    builder.writeNumber(source.minted_presale);
    builder.writeNumber(source.minted_liquidity);
    builder.writeNumber(source.minted_team);
    builder.writeNumber(source.minted_marketing);
    builder.writeNumber(source.minted_reserve);
    builder.writeAddress(source.presale_wallet);
    builder.writeAddress(source.liquidity_wallet);
    builder.writeAddress(source.team_wallet);
    builder.writeAddress(source.marketing_wallet);
    builder.writeAddress(source.reserve_wallet);
    builder.writeNumber(source.team_vesting_start);
    builder.writeNumber(source.team_vesting_claimed);
    return builder.build();
}

export function dictValueParserTbolaJetton$Data(): DictionaryValue<TbolaJetton$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTbolaJetton$Data(src)).endCell());
        },
        parse: (src) => {
            return loadTbolaJetton$Data(src.loadRef().beginParse());
        }
    }
}

 type TbolaJetton_init_args = {
    $$type: 'TbolaJetton_init_args';
    owner: Address;
    presale_wallet: Address;
    liquidity_wallet: Address;
    team_wallet: Address;
    marketing_wallet: Address;
    reserve_wallet: Address;
}

function initTbolaJetton_init_args(src: TbolaJetton_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.presale_wallet);
        b_0.storeAddress(src.liquidity_wallet);
        const b_1 = new Builder();
        b_1.storeAddress(src.team_wallet);
        b_1.storeAddress(src.marketing_wallet);
        b_1.storeAddress(src.reserve_wallet);
        b_0.storeRef(b_1.endCell());
    };
}

async function TbolaJetton_init(owner: Address, presale_wallet: Address, liquidity_wallet: Address, team_wallet: Address, marketing_wallet: Address, reserve_wallet: Address) {
    const __code = Cell.fromHex('b5ee9c7241024601000e23000228ff008e88f4a413f4bcf2c80bed5320e303ed43d9011e0202710210020120030802012004060295b438bda89a1a400031c71f481f481f481a803a1f481f481f48060206c206a20680da2aa08e0fea8e222a8e000a600213e211c213a20f820d620b420922070bc842049c61bb678ae20be1f01f050002290295b46edda89a1a400031c71f481f481f481a803a1f481f481f48060206c206a20680da2aa08e0fea8e222a8e000a600213e211c213a20f820d620b420922070bc842049c61bb678ae20be1f01f0700022b020120090e0201200a0c0295b1477b5134348000638e3e903e903e903500743e903e903e900c040d840d440d01b455411c1fd51c44551c0014c00427c4238427441f041ac4168412440e1790840938c376cf15c417c3e01f0b00022d0295b06ebb5134348000638e3e903e903e903500743e903e903e900c040d840d440d01b455411c1fd51c44551c0014c00427c4238427441f041ac4168412440e1790840938c376cf15c417c3e01f0d00022c0295b4b53da89a1a400031c71f481f481f481a803a1f481f481f48060206c206a20680da2aa08e0fea8e222a8e000a600213e211c213a20f820d620b420922070bc842049c61bb678ae20be1f01f0f0058219170e1f82322a1208208ed4e00b9923070e0820bc26700822a14e8348c4f00005203a801a90401b60821a1020120111c0201201217020158131502a1adbcf6a268690000c71c7d207d207d206a00e87d207d207d2018081b081a881a0368aa82383faa3888aa38002980084f8847084e883e0835882d0824881c2f210812718687888807aa876d9e2b882f87c01f140162f828db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d02c0295af16f6a268690000c71c7d207d207d206a00e87d207d207d2018081b081a881a0368aa82383faa3888aa38002980084f8847084e883e0835882d0824881c2f2108127186ed9e2b882f87c01f16002a8d04951093d3104e8c4c0c0c0c0c0c0c0c0c0e8e60020120181a0295b0063b5134348000638e3e903e903e903500743e903e903e900c040d840d440d01b455411c1fd51c44551c0014c00427c4238427441f041ac4168412440e1790840938c376cf15c417c3e01f1900022e0295b1147b5134348000638e3e903e903e903500743e903e903e900c040d840d440d01b455411c1fd51c44551c0014c00427c4238427441f041ac4168412440e1790840938c376cf15c417c3e01f1b001653cba02ba029a028a02aa00295bbf12ed44d0d200018e38fa40fa40fa40d401d0fa40fa40fa403010361035103406d15504707f5471115470005300109f108e109d107c106b105a104910385e421024e30ddb3c57105f0f81f1d00022f03e030eda2edfb01d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e38fa40fa40fa40d401d0fa40fa40fa403010361035103406d15504707f5471115470005300109f108e109d107c106b105a104910385e421024e30d1111935f0f5be02fd749c21fe3000ff901201f2027007afa00d200fa40fa00fa00fa00fa00fa00d401d0fa00fa40fa40fa40d430d0fa40fa40d31ffa003008111008108f108e108d108c108b108a10895710550e03fe0fd31f218210642b7d07ba8f7231d33f31fa00fa40308200e0ebf8422fc705f2f48200ddb82ff2f48230058d15e1762800008200dbb953e3a058bbf2f40f11100f10ef10de10cd10bc10ab109a1089107810671056104510341023011111015611db3c11101ca010ef10de0c0d10ab109a10891078106710561045103441302b2421022ce02182107bdd97debae3020182102c76b973bae3020f222503fc31d33ffa00fa40fa4030f82812db3c82008cf8f8425a705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0c705f2f4111001a18d0860000000000000000000000000000000000000000000000000000000000000000004561001c705b3923f30e30d10df551c2c232400a87080427004c8018210d53276db58cb1fcb3fc90411120441300111120110246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00008ac87f01ca00111055e0011110010ffa021dca001bce5009fa025007fa025005fa025003fa0201fa02c858fa0212ce12ce12ce02c8ce13ce14cb1f58fa0212cdcdc9ed54db3102fed33ffa40d20030f8285220db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0f8427080407005926d36df4635c855208210d17354005004cb1f12cb3fce01206e9430cf84809201cee2c9433010246d50436d03c8cf8580ca00cf8440ce01fa028069cf402c2600d0025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010df551cc87f01ca00111055e0011110010ffa021dca001bce5009fa025007fa025005fa025003fa0201fa02c858fa0212ce12ce12ce02c8ce13ce14cb1f58fa0212cdcdc9ed54db3103ec82e8aace05a1a967f815c33e97d56dc68d7a4ab0ceb5881532619c37340e411618bae3022082f080d81151ba84ac79dc10ef52a5592c8c32f590bff2b428ef2d19c0b37649e446bae3023d0c82f0ffbe0c5efb3f772f857f4608e880b68adfa183b28bdb05bffae72f6ac2ec9652bae3025f0ff2c082282a4504ec3082008aabf8422dc705f2f481235a2ac000f2f4822ac68af0bb140000822a14e8348c4f00008228b1a2bc2ec50000200f11110f5e3d0c11100c0b11110b0a11100a09111109081110080711110756100706111206050411120403021113020111140111115612db3c255611db3c235613db3c2256142b2b2b2901bedb3c3136363737f82310bf10ae109d5e38108a105910574605441403c87f01ca00111055e0011110010ffa021dca001bce5009fa025007fa025005fa025003fa0201fa02c858fa0212ce12ce12ce02c8ce13ce14cb1f58fa0212cdcdc9ed542b02fc308200db78f84224c705f2f48200cacc2fc200f2f4f8232fa18208ed4e0021820bc2670002bef2e65e822a14e8348c4f00005203a801a90401b6085610a18200aeff21c200f2f410ef10de10cd10bc10ab109a108923108910781067050610344013011111015611db3c095610a0111019a010ef10de10cd10bc10ab109a2b4402f6f82812db3c5c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0111323a08209312d00727f70f8288b0810231029c855308210178d45195005cb1f13cb3f01fa02cecec9061116064540031116035910465522c8cf8580ca00cf8440ce01fa0280692c43011688c87001ca005a02cecec92d0228ff008e88f4a413f4bcf2c80bed5320e303ed43d92e390202712f3702012030320147b951fed44d0d200019afa00fa40fa4055206c139afa40fa405902d1017059e2db3c6c3183100022002012033350147b4a3bda89a1a4000335f401f481f480aa40d82735f481f480b205a202e0b3c5b678d8630340002210147b7605da89a1a4000335f401f481f480aa40d82735f481f480b205a202e0b3c5b678d86303600108b677616c6c657480147bcb6076a268690000cd7d007d207d202a903609cd7d207d202c816880b82cf16d9e3618c3800022203c83001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019afa00fa40fa4055206c139afa40fa405902d1017059e204925f04e002d70d1ff2e0822182100f8a7ea5bae302218210178d4519bae302018210595f07bcbae3025f04f2c0823a3e4102de31d33ffa00fa40fa40f40431fa008200c241f84229c705917f95f8422ac705e2f2f48200d5575375bef2f45164a15138db3c5c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0038208989680a0727f54499052ccc8403b03fc55308210178d45195005cb1f13cb3f01fa02cecec910461510491037507210465522c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb008d08600000000000000000000000000000000000000000000000000000000000000000045210c705b3e30f023c3d42009c7080427004c8018210d53276db58cb1fcb3fc91034413010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0000025b015a31d33f31fa00fa4030815b6cf84210344565db3c15c70515f2f401a059c87f01ca0055205afa0212cecec9ed543f016021db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0400018f82ac87001ca005a02cecec901f2d33ffa00fa40308138c6f84226c705f2f48200d5575342bef2f45131a17080405414367f07c8553082107bdd97de5005cb1f13cb3f01fa02cecec926044313505510246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002420020c87f01ca0055205afa0212cecec9ed540042cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00009e107810671056104510344130c87f01ca00111055e0011110010ffa021dca001bce5009fa025007fa025005fa025003fa0201fa02c858fa0212ce12ce12ce02c8ce13ce14cb1f58fa0212cdcdc9ed5400cc82008aabf8422cc705f2f410ce700e10bd10ac109b108a107910681057104610354403c87f01ca00111055e0011110010ffa021dca001bce5009fa025007fa025005fa025003fa0201fa02c858fa0212ce12ce12ce02c8ce13ce14cb1f58fa0212cdcdc9ed5481be14c8');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initTbolaJetton_init_args({ $$type: 'TbolaJetton_init_args', owner, presale_wallet, liquidity_wallet, team_wallet, marketing_wallet, reserve_wallet })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const TbolaJetton_errors = {
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
    1630: { message: "Cliff period not reached" },
    9050: { message: "Already distributed" },
    14534: { message: "Not owner" },
    23404: { message: "Invalid sender wallet" },
    35499: { message: "Only owner" },
    36088: { message: "Invalid wallet" },
    44799: { message: "Nothing to claim" },
    49729: { message: "Unauthorized" },
    51916: { message: "Vesting not started" },
    54615: { message: "Insufficient balance" },
    56184: { message: "Only team wallet" },
    56249: { message: "Airdrop cap exceeded" },
    56760: { message: "Minting disabled" },
    57579: { message: "Only owner can mint" },
} as const

export const TbolaJetton_errors_backward = {
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
    "Cliff period not reached": 1630,
    "Already distributed": 9050,
    "Not owner": 14534,
    "Invalid sender wallet": 23404,
    "Only owner": 35499,
    "Invalid wallet": 36088,
    "Nothing to claim": 44799,
    "Unauthorized": 49729,
    "Vesting not started": 51916,
    "Insufficient balance": 54615,
    "Only team wallet": 56184,
    "Airdrop cap exceeded": 56249,
    "Minting disabled": 56760,
    "Only owner can mint": 57579,
} as const

const TbolaJetton_types: ABIType[] = [
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
    {"name":"Transfer","header":260734629,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"response_destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"custom_payload","type":{"kind":"simple","type":"cell","optional":true}},{"name":"forward_ton_amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forward_payload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"TransferNotification","header":395134233,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"forward_payload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"Burn","header":1499400124,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"response_destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"custom_payload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"BurnNotification","header":2078119902,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"response_destination","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Excesses","header":3576854235,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"ProvideWalletAddress","header":745978227,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"owner_address","type":{"kind":"simple","type":"address","optional":false}},{"name":"include_address","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"TakeWalletAddress","header":3513996288,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"wallet_address","type":{"kind":"simple","type":"address","optional":false}},{"name":"owner_address","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"Mint","header":1680571655,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"receiver","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"TbolaWallet$Data","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"jetton_master","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"TbolaJetton$Data","header":null,"fields":[{"name":"total_supply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mintable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"minted_airdrop","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"minted_presale","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"minted_liquidity","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"minted_team","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"minted_marketing","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"minted_reserve","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"presale_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidity_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"team_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"marketing_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"reserve_wallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"team_vesting_start","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"team_vesting_claimed","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
]

const TbolaJetton_opcodes = {
    "Transfer": 260734629,
    "TransferNotification": 395134233,
    "Burn": 1499400124,
    "BurnNotification": 2078119902,
    "Excesses": 3576854235,
    "ProvideWalletAddress": 745978227,
    "TakeWalletAddress": 3513996288,
    "Mint": 1680571655,
}

const TbolaJetton_getters: ABIGetter[] = [
    {"name":"get_jetton_data","methodId":106029,"arguments":[],"returnType":{"kind":"simple","type":"string","optional":false}},
    {"name":"total_supply","methodId":130834,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"mintable","methodId":106520,"arguments":[],"returnType":{"kind":"simple","type":"bool","optional":false}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"minted_airdrop","methodId":86458,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"minted_presale","methodId":74614,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"minted_team","methodId":65989,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"circulating_supply","methodId":111697,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"get_wallet_address","methodId":103289,"arguments":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"vesting_claimable","methodId":91561,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
]

export const TbolaJetton_getterMapping: { [key: string]: string } = {
    'get_jetton_data': 'getGetJettonData',
    'total_supply': 'getTotalSupply',
    'mintable': 'getMintable',
    'owner': 'getOwner',
    'minted_airdrop': 'getMintedAirdrop',
    'minted_presale': 'getMintedPresale',
    'minted_team': 'getMintedTeam',
    'circulating_supply': 'getCirculatingSupply',
    'get_wallet_address': 'getGetWalletAddress',
    'vesting_claimable': 'getVestingClaimable',
}

const TbolaJetton_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"Mint"}},
    {"receiver":"internal","message":{"kind":"text","text":"distribute_initial"}},
    {"receiver":"internal","message":{"kind":"text","text":"claim_team_vesting"}},
    {"receiver":"internal","message":{"kind":"typed","type":"BurnNotification"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ProvideWalletAddress"}},
    {"receiver":"internal","message":{"kind":"text","text":"disable_minting"}},
]


export class TbolaJetton implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly TOTAL_SUPPLY = 1000000000000000000n;
    public static readonly DECIMALS = 9n;
    public static readonly AIRDROP_PCT = 400n;
    public static readonly PRESALE_PCT = 200n;
    public static readonly LIQUIDITY_PCT = 150n;
    public static readonly TEAM_PCT = 150n;
    public static readonly MARKETING_PCT = 50n;
    public static readonly RESERVE_PCT = 50n;
    public static readonly errors = TbolaJetton_errors_backward;
    public static readonly opcodes = TbolaJetton_opcodes;
    
    static async init(owner: Address, presale_wallet: Address, liquidity_wallet: Address, team_wallet: Address, marketing_wallet: Address, reserve_wallet: Address) {
        return await TbolaJetton_init(owner, presale_wallet, liquidity_wallet, team_wallet, marketing_wallet, reserve_wallet);
    }
    
    static async fromInit(owner: Address, presale_wallet: Address, liquidity_wallet: Address, team_wallet: Address, marketing_wallet: Address, reserve_wallet: Address) {
        const __gen_init = await TbolaJetton_init(owner, presale_wallet, liquidity_wallet, team_wallet, marketing_wallet, reserve_wallet);
        const address = contractAddress(0, __gen_init);
        return new TbolaJetton(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new TbolaJetton(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  TbolaJetton_types,
        getters: TbolaJetton_getters,
        receivers: TbolaJetton_receivers,
        errors: TbolaJetton_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: Mint | "distribute_initial" | "claim_team_vesting" | BurnNotification | ProvideWalletAddress | "disable_minting") {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Mint') {
            body = beginCell().store(storeMint(message)).endCell();
        }
        if (message === "distribute_initial") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (message === "claim_team_vesting") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'BurnNotification') {
            body = beginCell().store(storeBurnNotification(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ProvideWalletAddress') {
            body = beginCell().store(storeProvideWalletAddress(message)).endCell();
        }
        if (message === "disable_minting") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetJettonData(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_jetton_data', builder.build())).stack;
        const result = source.readString();
        return result;
    }
    
    async getTotalSupply(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('total_supply', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getMintable(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('mintable', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
    async getOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getMintedAirdrop(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('minted_airdrop', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getMintedPresale(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('minted_presale', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getMintedTeam(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('minted_team', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getCirculatingSupply(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('circulating_supply', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getGetWalletAddress(provider: ContractProvider, owner: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(owner);
        const source = (await provider.get('get_wallet_address', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getVestingClaimable(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('vesting_claimable', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
}
import { createStore, Store } from 'redux'

import { ChainId } from '../../sdk'
import { addTransaction, checkedTransaction, clearAllTransactions, finalizeTransaction } from './actions'
import reducer, { initialState, TransactionState } from './reducer'

describe('transaction reducer', () => {
  let store: Store<TransactionState>

  beforeEach(() => {
    store = createStore(reducer, initialState)
  })

  describe('addTransaction', () => {
    it('adds the transaction', () => {
      const beforeTime = new Date().getTime()
      store.dispatch(
        addTransaction({
          chainId: ChainId.ZKEVMPOLYGON,
          summary: 'hello world',
          hash: '0x0',
          approval: { tokenAddress: 'abc', spender: 'def' },
          from: 'abc'
        })
      )
      const txs = store.getState()
      expect(txs[ChainId.ZKEVMPOLYGON]).toBeTruthy()
      expect(txs[ChainId.ZKEVMPOLYGON]?.['0x0']).toBeTruthy()
      const tx = txs[ChainId.ZKEVMPOLYGON]?.['0x0']
      expect(tx).toBeTruthy()
      expect(tx?.hash).toEqual('0x0')
      expect(tx?.summary).toEqual('hello world')
      expect(tx?.approval).toEqual({ tokenAddress: 'abc', spender: 'def' })
      expect(tx?.from).toEqual('abc')
      expect(tx?.addedTime).toBeGreaterThanOrEqual(beforeTime)
    })
  })

  describe('finalizeTransaction', () => {
    it('no op if not valid transaction', () => {
      store.dispatch(
        finalizeTransaction({
          chainId: ChainId.ZKEVMPOLYGON,
          hash: '0x0',
          receipt: {
            status: 1,
            transactionIndex: 1,
            transactionHash: '0x0',
            to: '0x0',
            from: '0x0',
            contractAddress: '0x0',
            blockHash: '0x0',
            blockNumber: 1
          }
        })
      )
      expect(store.getState()).toEqual({})
    })
    it('sets receipt', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: ChainId.ZKEVMPOLYGON,
          approval: { spender: '0x0', tokenAddress: '0x0' },
          summary: 'hello world',
          from: '0x0'
        })
      )
      const beforeTime = new Date().getTime()
      store.dispatch(
        finalizeTransaction({
          chainId: ChainId.ZKEVMPOLYGON,
          hash: '0x0',
          receipt: {
            status: 1,
            transactionIndex: 1,
            transactionHash: '0x0',
            to: '0x0',
            from: '0x0',
            contractAddress: '0x0',
            blockHash: '0x0',
            blockNumber: 1
          }
        })
      )
      const tx = store.getState()[ChainId.ZKEVMPOLYGON]?.['0x0']
      expect(tx?.summary).toEqual('hello world')
      expect(tx?.confirmedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(tx?.receipt).toEqual({
        status: 1,
        transactionIndex: 1,
        transactionHash: '0x0',
        to: '0x0',
        from: '0x0',
        contractAddress: '0x0',
        blockHash: '0x0',
        blockNumber: 1
      })
    })
  })

  describe('checkedTransaction', () => {
    it('no op if not valid transaction', () => {
      store.dispatch(
        checkedTransaction({
          chainId: ChainId.ZKEVMPOLYGON,
          hash: '0x0',
          blockNumber: 1
        })
      )
      expect(store.getState()).toEqual({})
    })
    it('sets lastCheckedBlockNumber', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: ChainId.ZKEVMPOLYGON,
          approval: { spender: '0x0', tokenAddress: '0x0' },
          summary: 'hello world',
          from: '0x0'
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: ChainId.ZKEVMPOLYGON,
          hash: '0x0',
          blockNumber: 1
        })
      )
      const tx = store.getState()[ChainId.ZKEVMPOLYGON]?.['0x0']
      expect(tx?.lastCheckedBlockNumber).toEqual(1)
    })
    it('never decreases', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: ChainId.ZKEVMPOLYGON,
          approval: { spender: '0x0', tokenAddress: '0x0' },
          summary: 'hello world',
          from: '0x0'
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: ChainId.ZKEVMPOLYGON,
          hash: '0x0',
          blockNumber: 3
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: ChainId.ZKEVMPOLYGON,
          hash: '0x0',
          blockNumber: 1
        })
      )
      const tx = store.getState()[ChainId.ZKEVMPOLYGON]?.['0x0']
      expect(tx?.lastCheckedBlockNumber).toEqual(3)
    })
  })

  describe('clearAllTransactions', () => {
    it('removes all transactions for the chain', () => {
      store.dispatch(
        addTransaction({
          chainId: ChainId.ZKEVMPOLYGON,
          summary: 'hello world',
          hash: '0x0',
          approval: { tokenAddress: 'abc', spender: 'def' },
          from: 'abc'
        })
      )
      expect(Object.keys(store.getState())).toHaveLength(1)
      expect(Object.keys(store.getState()[ChainId.ZKEVMPOLYGON] ?? {})).toEqual(['0x0'])
      store.dispatch(clearAllTransactions({ chainId: ChainId.ZKEVMPOLYGON }))
      expect(Object.keys(store.getState())).toHaveLength(1)
      expect(Object.keys(store.getState()[ChainId.ZKEVMPOLYGON] ?? {})).toEqual([])
    })
  })
})

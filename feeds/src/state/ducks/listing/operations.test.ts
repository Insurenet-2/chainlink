import configureStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { Contract } from 'ethers'
import { partialAsFull } from '@chainlink/ts-helpers'
import { INITIAL_STATE } from './reducers'
import * as operations from './operations'
import { FeedConfig } from '../../../config'
import * as utils from '../../../contracts/utils'

jest.mock('../../../contracts/utils')

const formatAnswerSpy = jest
  .spyOn(utils, 'formatAnswer')
  .mockImplementation(answer => answer)

const createContractSpy = jest
  .spyOn(utils, 'createContract')
  .mockImplementation(() => {
    const contract = partialAsFull<Contract>({
      latestAnswer: () => 'latestAnswer',
      currentAnswer: () => 'currentAnswer',
    })
    return contract
  })

const feed: FeedConfig = {
  contractAddress: '0xF79D6aFBb6dA890132F9D7c355e3015f15F3406F',
  contractType: 'aggregator',
  contractVersion: 2,
  name: 'ETH / USD',
  valuePrefix: '$',
  pair: ['ETH', 'USD'],
  heartbeat: 7200,
  path: 'eth-usd',
  networkId: 1,
  history: false,
  decimalPlaces: 3,
  multiply: '100000000',
  sponsored: ['Synthetix', 'Loopring', 'OpenLaw', '1inch', 'ParaSwap'],
  threshold: 0.5,
  compareOffchain:
    'https://www.tradingview.com/symbols/ETHUSD/?exchange=COINBASE',
  healthPrice:
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum',
  listing: true,
}

const middlewares = [thunk]
const mockStore = configureStore(middlewares)
const store = mockStore(INITIAL_STATE)

const dispatchWrapper = (f: any) => (...args: any[]) => {
  return f(...args)(store.dispatch, store.getState)
}

describe('state/ducks/listing', () => {
  describe('fetchAnswer', () => {
    beforeEach(() => {
      store.clearActions()
      jest.clearAllMocks()
    })

    it('should fetch answer list', async () => {
      await dispatchWrapper(operations.fetchAnswer)(feed)
      const actions = store.getActions()[0]
      expect(actions.type).toEqual('listing/FETCH_ANSWER_SUCCESS')
      // expect(actions.payload).toHaveLength(mainnetContracts.length)

      // const contractVersionOne = actions.payload.filter(
      //   (answer: any) => answer.config.contractVersion === 1,
      // )[0]

      // const contractVersionTwo = actions.payload.filter(
      //   (answer: any) => answer.config.contractVersion === 2,
      // )[0]

      // expect(contractVersionOne.answer).toEqual('currentAnswer')
      // expect(contractVersionTwo.answer).toEqual('latestAnswer')
      expect(formatAnswerSpy).toHaveBeenCalledTimes(1)
      expect(createContractSpy).toHaveBeenCalledTimes(1)
    })

    // it('should build a list of objects', async () => {
    //   await dispatchWrapper(operations.fetchAnswer)(feed)
    //   const actions = store.getActions()[0]
    //   expect(actions.payload[0]).toHaveProperty('answer')
    //   expect(actions.payload[0]).toHaveProperty('config')
    // })

    // it('should format answers', async () => {
    //   await dispatchWrapper(operations.fetchAnswer)(feed)
    //   expect(formatAnswerSpy).toHaveBeenCalledTimes(mainnetContracts.length)
    // })

    // it('should create a contracts for each config', async () => {
    //   await dispatchWrapper(operations.fetchAnswer)(feed)
    //   expect(createContractSpy).toHaveBeenCalledTimes(mainnetContracts.length)
    // })
  })
})

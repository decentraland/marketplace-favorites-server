import * as authorizationMiddleware from "decentraland-crypto-middleware"
import { fromDBPickStatsToPickStats, TPick } from "../../src/adapters/picks"
import {
  getPicksByItemIdHandler,
  getPickStatsHandler,
  getPickStatsOfItemHandler,
} from "../../src/controllers/handlers/picks-handlers"
import { DBGetFilteredPicksWithCount, DBPickStats } from "../../src/ports/picks"
import { AppComponents, HandlerContextWithPath, StatusCode } from "../../src/types"
import { createTestPicksComponent } from "../components"

let url: URL
let userAddress: string
let verification: authorizationMiddleware.DecentralandSignatureData | undefined
let components: Pick<AppComponents, "picks">
let itemId: string
let pickStats: DBPickStats
let getPicksStatsMock: jest.Mock

beforeEach(() => {
  userAddress = "0x58ae4c4cb2b35632ea98f214a2918b171f1e1247"
  verification = { auth: userAddress, authMetadata: {} }
  itemId = "0x0023693cd7f5ac9931ce9fc482c5c328198bc819-1"
  pickStats = {
    picked_by_user: true,
    item_id: itemId,
    count: 1000,
  }
})

beforeEach(() => {
  getPicksStatsMock = jest.fn()
  components = {
    picks: createTestPicksComponent({ getPicksStats: getPicksStatsMock }),
  }
})

describe("when getting the stats of a pick", () => {
  let request: HandlerContextWithPath<"picks", "/v1/picks/:itemId/stats">["request"]
  let params: HandlerContextWithPath<"picks", "/v1/picks/:itemId/stats">["params"]

  beforeEach(() => {
    request = {} as HandlerContextWithPath<"picks", "/v1/picks/:itemId/stats">["request"]
    params = { itemId }
    url = new URL(`http://localhost/v1/picks/${itemId}/stats`)
  })

  describe("and the power parameter is set and it's not a number", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/picks/${itemId}/stats?power=anInvalidValue`)
    })

    it("should return a bad request response", () => {
      return expect(getPickStatsOfItemHandler({ params, components, url, request, verification })).resolves.toEqual({
        status: StatusCode.BAD_REQUEST,
        body: {
          ok: false,
          message: `The value of the power parameter is invalid: anInvalidValue`,
        },
      })
    })
  })

  describe("and the power parameter is set as a number", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/picks/${itemId}/stats?power=200`)
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    it("should request the stats using the power parameter", async () => {
      await getPickStatsOfItemHandler({ params, components, url, request, verification })
      expect(getPicksStatsMock).toHaveBeenCalledWith([itemId], expect.objectContaining({ power: 200 }))
    })
  })

  describe("and the power parameter is not set", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/picks/${itemId}/stats`)
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    it("should request the stats without the power parameter", async () => {
      await getPickStatsOfItemHandler({ params, components, url, request, verification })
      expect(getPicksStatsMock).toHaveBeenCalledWith([itemId], expect.objectContaining({ power: undefined }))
    })
  })

  describe("and the request is authenticated with a signature", () => {
    beforeEach(() => {
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    it("should request the stats using the user address of the authenticated user", async () => {
      await getPickStatsOfItemHandler({ params, components, url, request, verification })
      expect(getPicksStatsMock).toHaveBeenCalledWith([itemId], expect.objectContaining({ userAddress }))
    })
  })

  describe("and the request is not authenticated with a signature", () => {
    beforeEach(() => {
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    it("should request the stats without a user address", async () => {
      await getPickStatsOfItemHandler({ params, components, url, request, verification: undefined })
      expect(getPicksStatsMock).toHaveBeenCalledWith([itemId], expect.objectContaining({ userAddress: undefined }))
    })
  })

  describe("and getting the pick stats fails", () => {
    let error: Error

    beforeEach(() => {
      error = new Error("anError")
      getPicksStatsMock.mockRejectedValueOnce(error)
    })

    it("should propagate the error", () => {
      return expect(getPickStatsOfItemHandler({ params, components, url, request, verification })).rejects.toEqual(
        error
      )
    })
  })

  describe("and the request is successful", () => {
    beforeEach(() => {
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    it("should return an ok response with the stats", () => {
      return expect(getPickStatsOfItemHandler({ params, components, url, request, verification })).resolves.toEqual({
        status: StatusCode.OK,
        body: {
          ok: true,
          data: fromDBPickStatsToPickStats(pickStats),
        },
      })
    })
  })
})

describe("when getting the stats of picks", () => {
  beforeEach(() => {
    url = new URL(`http://localhost/v1/picks/stats`)
  })

  describe("and there are no item ids sent as query parameters", () => {
    it("should return a bad request response", () => {
      return expect(getPickStatsHandler({ components, url })).resolves.toEqual({
        status: StatusCode.BAD_REQUEST,
        body: {
          ok: false,
          message: "The request must include at least one item id.",
        },
      })
    })
  })

  describe("and the power parameter is set and it's not a number", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/picks/stats?power=anInvalidValue&itemId=${itemId}`)
    })

    it("should return a bad request response", () => {
      return expect(getPickStatsHandler({ components, url })).resolves.toEqual({
        status: StatusCode.BAD_REQUEST,
        body: {
          ok: false,
          message: "The value of the power parameter is invalid: anInvalidValue",
        },
      })
    })
  })

  describe("and the power parameter is set as a number", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/picks/stats?power=200&itemId=${itemId}`)
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    it("should request the stats using the power parameter", async () => {
      await getPickStatsHandler({ components, url })
      expect(getPicksStatsMock).toHaveBeenCalledWith([itemId], expect.objectContaining({ power: 200 }))
    })
  })

  describe("and the power parameter is not set", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/picks/stats?itemId=${itemId}`)
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    it("should request the stats without the power parameter", async () => {
      await getPickStatsHandler({ components, url })
      expect(getPicksStatsMock).toHaveBeenCalledWith([itemId], expect.objectContaining({ power: undefined }))
    })
  })

  describe("and the checkingUserAddress parameter is set", () => {
    beforeEach(() => {
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    describe("and the address is not an ethereum address", () => {
      beforeEach(() => {
        url = new URL(`http://localhost/v1/picks/stats?checkingUserAddress=somethingNotAddress&itemId=${itemId}`)
      })

      it("should return a bad request response", () => {
        return expect(getPickStatsHandler({ components, url })).resolves.toEqual({
          status: StatusCode.BAD_REQUEST,
          body: {
            ok: false,
            message: "The checking user address parameter must be an Ethereum Address.",
          },
        })
      })
    })

    describe("and the address is an ethereum address", () => {
      beforeEach(() => {
        url = new URL(`http://localhost/v1/picks/stats?checkingUserAddress=${userAddress}&itemId=${itemId}`)
      })

      it("should request the stats with the user address", async () => {
        await getPickStatsHandler({ components, url })
        expect(getPicksStatsMock).toHaveBeenCalledWith(
          [itemId],
          expect.objectContaining({ power: undefined, userAddress })
        )
      })
    })
  })

  describe("and the checkingUserAddress parameter is not set", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/picks/stats?itemId=${itemId}`)
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    it("should request the stats without the user address parameter", async () => {
      await getPickStatsHandler({ components, url })
      expect(getPicksStatsMock).toHaveBeenCalledWith([itemId], expect.objectContaining({ userAddress: undefined }))
    })
  })

  describe("and getting the pick stats fails", () => {
    let error: Error

    beforeEach(() => {
      error = new Error("anError")
      url = new URL(`http://localhost/v1/picks/stats?itemId=${itemId}`)
      getPicksStatsMock.mockRejectedValueOnce(error)
    })

    it("should propagate the error", () => {
      return expect(getPickStatsHandler({ components, url })).rejects.toEqual(error)
    })
  })

  describe("and the request is successful", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/picks/stats?itemId=${itemId}`)
      getPicksStatsMock.mockResolvedValueOnce([pickStats])
    })

    it("should return an ok response with the stats", () => {
      return expect(getPickStatsHandler({ components, url })).resolves.toEqual({
        status: StatusCode.OK,
        body: {
          ok: true,
          data: [fromDBPickStatsToPickStats(pickStats)],
        },
      })
    })
  })
})

describe("when getting the picks for an item", () => {
  let url: URL
  let getPicksByItemIdMock: jest.Mock
  let request: HandlerContextWithPath<"picks", "/v1/picks/:itemId">["request"]
  let params: HandlerContextWithPath<"picks", "/v1/picks/:itemId">["params"]
  let userAddress: string
  let anotherUserAddress: string
  let dbPicksByItemId: DBGetFilteredPicksWithCount[]
  let picks: Pick<TPick, "userAddress">[]

  beforeEach(() => {
    itemId = "item-id"
    getPicksByItemIdMock = jest.fn()
    components = {
      picks: createTestPicksComponent({ getPicksByItemId: getPicksByItemIdMock }),
    }
    request = {} as HandlerContextWithPath<"lists", "/v1/lists/:id/picks">["request"]
    url = new URL(`http://localhost/v1/lists/${itemId}/picks`)
    params = { itemId }
    userAddress = "0x687abb534BD927284F84b03d43f33dF0E5C91D21"
    anotherUserAddress = "0x45abb534BD927284F84b03d43f33dF0E5C91C21f"

    dbPicksByItemId = [
      {
        item_id: "1",
        user_address: userAddress,
        list_id: "e96df126-f5bf-4311-94d8-6e261f368bb2",
        created_at: new Date(),
        picks_count: 2,
      },
      {
        item_id: "1",
        user_address: anotherUserAddress,
        list_id: "f96df126-f5bf-4311-94d8-6e261f368bb4",
        created_at: new Date(),
        picks_count: 2,
      },
    ]
  })

  describe("and the process to get the picks fails", () => {
    let error: Error

    beforeEach(() => {
      error = new Error("anError")
      getPicksByItemIdMock.mockRejectedValueOnce(error)
    })

    it("should propagate the error", () => {
      return expect(getPicksByItemIdHandler({ params, components, url, request })).rejects.toEqual(error)
    })
  })

  describe("and the power parameter is set and it's not a number", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/lists/${itemId}/picks?power=anInvalidValue`)
    })

    it("should return a bad request response", () => {
      return expect(getPicksByItemIdHandler({ params, components, url, request })).resolves.toEqual({
        status: StatusCode.BAD_REQUEST,
        body: {
          ok: false,
          message: `The value of the power parameter is invalid: anInvalidValue`,
        },
      })
    })
  })

  describe("and the power parameter is set as a number", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/lists/${itemId}/picks?power=200`)
      getPicksByItemIdMock.mockResolvedValueOnce([])
    })

    it("should request the picks by item id using the power parameter", async () => {
      await getPicksByItemIdHandler({ params, components, url, request })
      expect(getPicksByItemIdMock).toHaveBeenCalledWith(itemId, expect.objectContaining({ power: 200 }))
    })
  })

  describe("and the power parameter is not set", () => {
    beforeEach(() => {
      url = new URL(`http://localhost/v1/lists/${itemId}/picks`)
      getPicksByItemIdMock.mockResolvedValueOnce([])
    })

    it("should request the picks by item id without the power parameter", async () => {
      await getPicksByItemIdHandler({ params, components, url, request })
      expect(getPicksByItemIdMock).toHaveBeenCalledWith(itemId, expect.objectContaining({ power: undefined }))
    })
  })

  describe("and the process to get the picks is successful", () => {
    describe("when not using pagination parameters", () => {
      beforeEach(() => {
        picks = [{ userAddress }, { userAddress: anotherUserAddress }]
        getPicksByItemIdMock.mockResolvedValueOnce(dbPicksByItemId)
      })

      it("should return a response with an ok status code and the picks using the default values of limit and page", () => {
        return expect(getPicksByItemIdHandler({ url, components, request, params })).resolves.toEqual({
          status: StatusCode.OK,
          body: {
            ok: true,
            data: {
              results: picks,
              total: 2,
              page: 0,
              pages: 1,
              limit: 100,
            },
          },
        })
      })
    })

    describe("when using the pagination parameters", () => {
      describe("when the limit is 1 and the page is 0", () => {
        beforeEach(() => {
          url = new URL(`http://localhost/v1/lists/${itemId}/picks?limit=1&page=0`)
          picks = [{ userAddress }]
          getPicksByItemIdMock.mockResolvedValueOnce([dbPicksByItemId[0]])
        })

        it("should return an array with the first pick", () => {
          return expect(getPicksByItemIdHandler({ url, components, request, params })).resolves.toEqual({
            status: StatusCode.OK,
            body: {
              ok: true,
              data: {
                results: picks,
                total: 2,
                page: 0,
                pages: 2,
                limit: 1,
              },
            },
          })
        })
      })

      describe("limit is 1 and the page is 1", () => {
        beforeEach(() => {
          url = new URL(`http://localhost/v1/lists/${itemId}/picks?limit=1&page=1`)
          picks = [{ userAddress: anotherUserAddress }]
          getPicksByItemIdMock.mockResolvedValueOnce([dbPicksByItemId[1]])
        })

        it("should return an array with the second pick", () => {
          return expect(getPicksByItemIdHandler({ url, components, request, params })).resolves.toEqual({
            status: StatusCode.OK,
            body: {
              ok: true,
              data: {
                results: picks,
                total: 2,
                page: 1,
                pages: 2,
                limit: 1,
              },
            },
          })
        })
      })
    })
  })
})

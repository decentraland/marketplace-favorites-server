import { fromDBGetPickByListIdPickToPicksWithCount } from "../../src/adapters/lists"
import { DBGetPickByListId, PicksWithCount } from "../../src/ports/lists"

describe("when transforming DB retrieved picks to picks with count", () => {
  let dbGetPicksByListId: DBGetPickByListId[]
  let picksWithCount: PicksWithCount

  beforeEach(() => {
    dbGetPicksByListId = [
      {
        item_id: "1",
        picks_count: 3,
      },
      {
        item_id: "11",
        picks_count: 3,
      },
      {
        item_id: "111",
        picks_count: 3,
      },
    ]
    picksWithCount = {
      picks: [{ itemId: "1" }, { itemId: "11" }, { itemId: "111" }],
      count: 3,
    }
  })

  it("should return the transformed picks with count", () => {
    expect(fromDBGetPickByListIdPickToPicksWithCount(dbGetPicksByListId)).toEqual(picksWithCount)
  })
})
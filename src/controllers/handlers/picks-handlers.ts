import { getNumberParameter } from "../../logic/http"
import { InvalidParameterError } from "../../logic/http/errors"
import { PickStats } from "../../ports/picks"
import { HandlerContextWithPath, HTTPResponse, StatusCode } from "../../types"

export async function getPickStatsHandler(
  context: Pick<
    HandlerContextWithPath<"picks", "/v1/picks/:itemId/stats">,
    "url" | "components" | "params" | "request" | "verification"
  >
): Promise<HTTPResponse<PickStats>> {
  const {
    url,
    components: { picks },
    verification,
    params,
  } = context
  const userAddress: string | undefined = verification?.auth.toLowerCase()

  try {
    const power = getNumberParameter("power", url.searchParams)

    const pickStats = await picks.getPickStats(params.itemId, { userAddress, power: power ?? undefined })

    return {
      status: StatusCode.OK,
      body: {
        ok: true,
        data: pickStats,
      },
    }
  } catch (error) {
    if (error instanceof InvalidParameterError) {
      return {
        status: StatusCode.BAD_REQUEST,
        body: {
          ok: false,
          message: error.message,
        },
      }
    }

    throw error
  }
}

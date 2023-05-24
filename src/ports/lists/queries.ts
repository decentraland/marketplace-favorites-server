import SQL from 'sql-template-strings'
import { DEFAULT_LIST_USER_ADDRESS } from '../../migrations/1678303321034_default-list'
import { Permission } from '../access'
import { GRANTED_TO_ALL } from './constants'
import { GetListOptions } from './types'

export function getListQuery(listId: string, { requiredPermission, considerDefaultList = true, userAddress }: GetListOptions) {
  const query = SQL`
      SELECT favorites.lists.*, favorites.acl.permission AS permission, COUNT(favorites.picks.item_id) AS count_items
      FROM favorites.lists
      LEFT JOIN favorites.picks ON favorites.lists.id = favorites.picks.list_id AND favorites.picks.user_address = ${userAddress}
      LEFT JOIN favorites.acl ON favorites.lists.id = favorites.acl.list_id`

  query.append(SQL` WHERE favorites.lists.id = ${listId} AND (favorites.lists.user_address = ${userAddress}`)
  if (considerDefaultList) {
    query.append(SQL` OR favorites.lists.user_address = ${DEFAULT_LIST_USER_ADDRESS}`)
  }
  query.append(')')

  if (requiredPermission) {
    const requiredPermissions = (requiredPermission === Permission.VIEW ? [Permission.VIEW, Permission.EDIT] : [requiredPermission]).join(
      ','
    )
    query.append(
      SQL` OR ((favorites.acl.grantee = ${userAddress} OR favorites.acl.grantee = ${GRANTED_TO_ALL}) AND favorites.acl.permission IN (${requiredPermissions}))`
    )
  }

  query.append(SQL` GROUP BY favorites.lists.id, favorites.acl.permission`)
  query.append(SQL` ORDER BY favorites.acl.permission ASC LIMIT 1`)

  return query
}
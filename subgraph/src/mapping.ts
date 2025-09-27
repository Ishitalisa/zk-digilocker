// The Graph mapping for ZK DigiLocker
// Handles ProfileVerified events and builds queryable entities

import { BigInt, Bytes, log } from "@graphprotocol/graph-ts"
import {
  ProfileManager,
  ProfileVerified
} from "../generated/ProfileManager/ProfileManager"
import {
  User,
  Profile,
  Verification,
  ENSQuery,
  DailyStats
} from "../generated/schema"

export function handleProfileVerified(event: ProfileVerified): void {
  // Extract event data
  let userAddress = event.params.user.toHexString()
  let ensName = event.params.ensName
  let isAdult = event.params.isAdult
  let isIndian = event.params.isIndian
  let hasExpired = event.params.hasExpired
  let timestamp = event.params.timestamp
  let txHash = event.transaction.hash.toHexString()
  let blockNumber = event.block.number
  
  log.info("Processing ProfileVerified event for user: {} with ENS: {}", [
    userAddress,
    ensName
  ])

  // Create or update User entity
  let user = User.load(userAddress)
  if (!user) {
    user = new User(userAddress)
    user.createdAt = event.block.timestamp
    user.verifications = []
  }
  user.ensName = ensName
  user.updatedAt = event.block.timestamp
  user.save()

  // Create or update Profile entity
  let profile = Profile.load(userAddress)
  if (!profile) {
    profile = new Profile(userAddress)
    profile.user = userAddress
    profile.verifiedAt = event.block.timestamp
  }
  
  profile.ensName = ensName
  profile.isAdult = isAdult
  profile.isIndian = isIndian
  profile.hasExpired = hasExpired
  profile.lastUpdated = event.block.timestamp
  profile.isActive = true
  profile.save()

  // Create Verification record (for history tracking)
  let verificationId = txHash
  let verification = new Verification(verificationId)
  verification.user = userAddress
  verification.ensName = ensName
  verification.isAdult = isAdult
  verification.isIndian = isIndian
  verification.hasExpired = hasExpired
  verification.transactionHash = txHash
  verification.blockNumber = blockNumber
  verification.timestamp = event.block.timestamp
  verification.gasUsed = BigInt.fromI32(0) // Can be calculated from transaction
  verification.save()

  // Create/update ENS Query optimization entity
  let ensQuery = ENSQuery.load(ensName)
  if (!ensQuery) {
    ensQuery = new ENSQuery(ensName)
    ensQuery.ensName = ensName
    ensQuery.user = userAddress
    ensQuery.profile = userAddress
    ensQuery.queryCount = BigInt.fromI32(0)
  }
  ensQuery.lastQueried = event.block.timestamp
  ensQuery.save()

  // Update daily statistics
  updateDailyStats(event.block.timestamp, isAdult, isIndian, hasExpired)
  
  log.info("Successfully processed ProfileVerified event for ENS: {}", [ensName])
}

function updateDailyStats(
  timestamp: BigInt,
  isAdult: boolean,
  isIndian: boolean,
  hasExpired: boolean
): void {
  // Calculate date string (YYYY-MM-DD)
  let dayTimestamp = timestamp.toI32() - (timestamp.toI32() % 86400) // Round to start of day
  let dateString = new Date(dayTimestamp * 1000).toISOString().split('T')[0]
  
  let stats = DailyStats.load(dateString)
  if (!stats) {
    stats = new DailyStats(dateString)
    stats.date = dateString
    stats.totalVerifications = BigInt.fromI32(0)
    stats.totalUsers = BigInt.fromI32(0)
    stats.adultUsers = BigInt.fromI32(0)
    stats.indianUsers = BigInt.fromI32(0)
    stats.expiredDocuments = BigInt.fromI32(0)
  }
  
  stats.totalVerifications = stats.totalVerifications.plus(BigInt.fromI32(1))
  stats.totalUsers = stats.totalUsers.plus(BigInt.fromI32(1))
  
  if (isAdult) {
    stats.adultUsers = stats.adultUsers.plus(BigInt.fromI32(1))
  }
  
  if (isIndian) {
    stats.indianUsers = stats.indianUsers.plus(BigInt.fromI32(1))
  }
  
  if (hasExpired) {
    stats.expiredDocuments = stats.expiredDocuments.plus(BigInt.fromI32(1))
  }
  
  stats.save()
}
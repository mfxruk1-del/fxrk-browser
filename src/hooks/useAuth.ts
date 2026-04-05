import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import type { Account, Profile, Credential, OAuthProviderConfig } from '../../electron/utils/types'

const fxrk = window.fxrk

export function useAuth() {
  const {
    accounts, profiles, credentials, activeProfileId,
    setAccounts, addAccount, removeAccount,
    setProfiles, addProfile, removeProfile, setActiveProfileId,
    setCredentials, addCredential, removeCredential,
  } = useAuthStore()

  const { addToast } = useUIStore()

  useEffect(() => {
    Promise.all([
      fxrk.auth.getAccounts(),
      fxrk.auth.getProfiles(),
      fxrk.auth.getCredentials(),
      fxrk.auth.getActiveProfile(),
    ]).then(([accts, profs, creds, profileId]) => {
      setAccounts(accts as Account[])
      setProfiles(profs as Profile[])
      setCredentials(creds as Credential[])
      setActiveProfileId(profileId as string)
    })
  }, [setAccounts, setProfiles, setCredentials, setActiveProfileId])

  const loginWithOAuth = useCallback(async (provider: string, config: OAuthProviderConfig) => {
    try {
      const account = await fxrk.auth.addAccount(provider, config as Record<string, unknown>) as Account
      addAccount(account)
      addToast(`Connected ${provider} account: ${account.email}`, 'success')
      return account
    } catch (err) {
      addToast(`Login failed: ${err}`, 'error')
      return null
    }
  }, [addAccount, addToast])

  const disconnectAccount = useCallback(async (id: string) => {
    await fxrk.auth.removeAccount(id)
    removeAccount(id)
  }, [removeAccount])

  const createProfile = useCallback(async (name: string, avatar?: string, color?: string) => {
    const profile = await fxrk.auth.createProfile(name, avatar, color) as Profile
    addProfile(profile)
    addToast(`Profile "${name}" created`, 'success')
    return profile
  }, [addProfile, addToast])

  const switchProfile = useCallback(async (id: string) => {
    await fxrk.auth.switchProfile(id)
    setActiveProfileId(id)
  }, [setActiveProfileId])

  const deleteProfile = useCallback(async (id: string) => {
    await fxrk.auth.deleteProfile(id)
    removeProfile(id)
  }, [removeProfile])

  const saveCredential = useCallback(async (cred: Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'profileId'>) => {
    const saved = await fxrk.auth.saveCredential(cred as Record<string, unknown>) as Credential
    addCredential(saved)
    addToast('Password saved', 'success')
    return saved
  }, [addCredential, addToast])

  const deleteCredential = useCallback(async (id: string) => {
    await fxrk.auth.deleteCredential(id)
    removeCredential(id)
  }, [removeCredential])

  const generatePassword = useCallback(async (length?: number) => {
    return await fxrk.auth.generatePassword(length) as string
  }, [])

  return {
    accounts,
    profiles,
    credentials,
    activeProfileId,
    loginWithOAuth,
    disconnectAccount,
    createProfile,
    switchProfile,
    deleteProfile,
    saveCredential,
    deleteCredential,
    generatePassword,
  }
}

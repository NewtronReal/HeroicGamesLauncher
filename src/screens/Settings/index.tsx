import React, { useEffect, useState } from 'react'

import { IpcRenderer } from 'electron'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import './index.css'
import { AppSettings, WineProps } from 'src/types'
import { getGameInfo, writeConfig } from 'src/helpers'
import { useToggle } from 'src/hooks'
import GeneralSettings from './components/GeneralSettings'
import Header from 'src/components/UI/Header'
import OtherSettings from './components/OtherSettings'
import SyncSaves from './components/SyncSaves'
import Tools from './components/Tools'
import UpdateComponent from 'src/components/UI/UpdateComponent'
import WineSettings from './components/WineSettings'

interface ElectronProps {
  ipcRenderer: IpcRenderer
}

const { ipcRenderer } = window.require('electron') as ElectronProps
const storage: Storage = window.localStorage
interface RouteParams {
  appName: string
  type: string
}

interface LocationState {
  fromGameCard: boolean
}

// TODO: add feedback when launching winecfg and winetricks

function Settings() {
  const { t, i18n } = useTranslation()
  const { state } = useLocation() as { state: LocationState }

  const [wineVersion, setWineversion] = useState({
    bin: '/usr/bin/wine',
    name: 'Wine Default'
  } as WineProps)
  const [winePrefix, setWinePrefix] = useState('~/.wine')
  const [defaultInstallPath, setDefaultInstallPath] = useState('')
  const [otherOptions, setOtherOptions] = useState('')
  const [launcherArgs, setLauncherArgs] = useState('')
  const [egsLinkedPath, setEgsLinkedPath] = useState('')
  const [title, setTitle] = useState('')
  const [maxWorkers, setMaxWorkers] = useState(0)
  const [egsPath, setEgsPath] = useState(egsLinkedPath)
  const [language, setLanguage] = useState(
    () => storage.getItem('language') || 'en'
  )
  const [customWinePaths, setCustomWinePaths] = useState([] as Array<string>)
  const [savesPath, setSavesPath] = useState('')
  const {
    on: useGameMode,
    toggle: toggleUseGameMode,
    setOn: setUseGameMode
  } = useToggle(false)
  const { on: showFps, toggle: toggleFps, setOn: setShowFps } = useToggle(false)
  const {
    on: offlineMode,
    toggle: toggleOffline,
    setOn: setShowOffline
  } = useToggle(false)
  const {
    on: audioFix,
    toggle: toggleAudioFix,
    setOn: setAudioFix
  } = useToggle(false)
  const {
    on: showMangohud,
    toggle: toggleMangoHud,
    setOn: setShowMangoHud
  } = useToggle(false)
  const {
    on: exitToTray,
    toggle: toggleTray,
    setOn: setExitToTray
  } = useToggle(false)
  const {
    on: darkTrayIcon,
    toggle: toggleDarkTrayIcon,
    setOn: setDarkTrayIcon
  } = useToggle(false)
  const {
    on: autoInstallDxvk,
    toggle: toggleAutoInstallDxvk,
    setOn: setAutoInstallDxvk
  } = useToggle(false)

  const [haveCloudSaving, setHaveCloudSaving] = useState({
    cloudSaveEnabled: false,
    saveFolder: ''
  })
  const [autoSyncSaves, setAutoSyncSaves] = useState(false)
  const [altWine, setAltWine] = useState([] as WineProps[])

  const { appName, type } = useParams() as RouteParams
  const isDefault = appName === 'default'
  const isGeneralSettings = type === 'general'
  const isWineSettings = type === 'wine'
  const isSyncSettings = type === 'sync'
  const isOtherSettings = type === 'other'

  useEffect(() => {
    const getSettings = async () => {
      const config: AppSettings = await ipcRenderer.invoke(
        'requestSettings',
        appName
      )
      setUseGameMode(config.useGameMode || false)
      setShowFps(config.showFps || false)
      setShowOffline(config.offlineMode || false)
      setAudioFix(config.audioFix || false)
      setShowMangoHud(config.showMangohud || false)
      setDefaultInstallPath(config.defaultInstallPath)
      setWineversion(config.wineVersion)
      setWinePrefix(config.winePrefix)
      setOtherOptions(config.otherOptions)
      setLauncherArgs(config.launcherArgs)
      setEgsLinkedPath(config.egsLinkedPath || '')
      setEgsPath(config.egsLinkedPath || '')
      setAutoSyncSaves(config.autoSyncSaves)
      setExitToTray(config.exitToTray || false)
      setDarkTrayIcon(config.darkTrayIcon || false)
      setAutoInstallDxvk(config.autoInstallDxvk || false)
      setSavesPath(config.savesPath || '')
      setMaxWorkers(config.maxWorkers ?? 2)
      setCustomWinePaths(config.customWinePaths || [])

      if (!isDefault) {
        const {
          cloudSaveEnabled,
          saveFolder,
          title: gameTitle
        } = await getGameInfo(appName)
        setTitle(gameTitle)
        return setHaveCloudSaving({ cloudSaveEnabled, saveFolder })
      }
      return setTitle(t('globalSettings', 'Global Settings'))
    }
    getSettings()

    return () => {
      ipcRenderer.removeAllListeners('requestSettings')
    }
  }, [appName, type, isDefault, i18n.language])

  const GlobalSettings = {
    defaultSettings: {
      audioFix,
      customWinePaths,
      darkTrayIcon,
      defaultInstallPath,
      egsLinkedPath,
      exitToTray,
      language,
      maxWorkers,
      offlineMode,
      otherOptions,
      showFps,
      showMangohud,
      useGameMode,
      winePrefix,
      wineVersion
    } as AppSettings
  }

  const GameSettings = {
    [appName]: {
      audioFix,
      autoInstallDxvk,
      autoSyncSaves,
      launcherArgs,
      offlineMode,
      otherOptions,
      savesPath,
      showFps,
      showMangohud,
      useGameMode,
      winePrefix,
      wineVersion
    } as AppSettings
  }

  const settingsToSave = isDefault ? GlobalSettings : GameSettings

  let returnPath: string | null = isDefault ? '/' : `/gameconfig/${appName}`

  if (state && state.fromGameCard) {
    returnPath = null
  }

  useEffect(() => {
    writeConfig([appName, settingsToSave])
  }, [GlobalSettings, GameSettings, appName])

  if (!title) {
    return <UpdateComponent />
  }

  return (
    <>
      <Header goTo={returnPath} renderBackButton title={title} />
      <div className="Settings">
        <div className="settingsNavbar">
          {isDefault && (
            <NavLink to={{ pathname: '/settings/default/general' }}>
              {t('settings.navbar.general')}
            </NavLink>
          )}
          <NavLink to={{ pathname: `/settings/${appName}/wine` }}>Wine</NavLink>
          {!isDefault && haveCloudSaving.cloudSaveEnabled && (
            <NavLink to={{ pathname: `/settings/${appName}/sync` }}>
              {t('settings.navbar.sync')}
            </NavLink>
          )}
          <NavLink to={{ pathname: `/settings/${appName}/other` }}>
            {t('settings.navbar.other')}
          </NavLink>
        </div>
        <div className="settingsWrapper">
          {isGeneralSettings && (
            <GeneralSettings
              egsPath={egsPath}
              setEgsPath={setEgsPath}
              egsLinkedPath={egsLinkedPath}
              setEgsLinkedPath={setEgsLinkedPath}
              defaultInstallPath={defaultInstallPath}
              setDefaultInstallPath={setDefaultInstallPath}
              exitToTray={exitToTray}
              toggleTray={toggleTray}
              language={language}
              setLanguage={setLanguage}
              maxWorkers={maxWorkers}
              setMaxWorkers={setMaxWorkers}
              toggleDarkTrayIcon={toggleDarkTrayIcon}
              darkTrayIcon={darkTrayIcon}
            />
          )}
          {isWineSettings && (
            <WineSettings
              altWine={altWine}
              setAltWine={setAltWine}
              wineVersion={wineVersion}
              winePrefix={winePrefix}
              setWineversion={setWineversion}
              setWinePrefix={setWinePrefix}
              autoInstallDxvk={autoInstallDxvk}
              toggleAutoInstallDxvk={toggleAutoInstallDxvk}
              customWinePaths={customWinePaths}
              setCustomWinePaths={setCustomWinePaths}
              isDefault={isDefault}
            />
          )}
          {isWineSettings && (
            <Tools winePrefix={winePrefix} wineVersion={wineVersion} />
          )}
          {isOtherSettings && (
            <OtherSettings
              otherOptions={otherOptions}
              setOtherOptions={setOtherOptions}
              launcherArgs={launcherArgs}
              setLauncherArgs={setLauncherArgs}
              useGameMode={useGameMode}
              toggleUseGameMode={toggleUseGameMode}
              showFps={showFps}
              toggleFps={toggleFps}
              offlineMode={offlineMode}
              toggleOffline={toggleOffline}
              audioFix={audioFix}
              toggleAudioFix={toggleAudioFix}
              showMangohud={showMangohud}
              toggleMangoHud={toggleMangoHud}
              isDefault={isDefault}
            />
          )}
          {isSyncSettings && (
            <SyncSaves
              savesPath={savesPath}
              setSavesPath={setSavesPath}
              appName={appName}
              autoSyncSaves={autoSyncSaves}
              setAutoSyncSaves={setAutoSyncSaves}
              defaultFolder={winePrefix}
              isProton={wineVersion.name.includes('Proton')}
              winePrefix={winePrefix}
            />
          )}
          <span className="save">{t('info.settings')}</span>
        </div>
      </div>
    </>
  )
}

export default React.memo(Settings)

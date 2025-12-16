'use client'
import Logo from '@/components/Logo'
import { useLayoutContext } from '@/context/useLayoutContext'
import CustomizerToggler from '@/layouts/components/topbar/components/CustomizerToggler'
import LanguageDropdown from '@/layouts/components/topbar/components/LanguageDropdown'
import MegaMenu from '@/layouts/components/topbar/components/MegaMenu'
import MessageDropdown from '@/layouts/components/topbar/components/MessageDropdown'
import ThemeToggler from '@/layouts/components/topbar/components/ThemeToggler'
import UserProfile from '@/layouts/components/topbar/components/UserProfile'
import { Container, FormControl } from 'react-bootstrap'
import { LuSearch } from 'react-icons/lu'
import { TbMenu4 } from 'react-icons/tb'

import ApplicationMenu from '@/layouts/components/topbar/components/ApplicationMenu'
import FullscreenToggle from '@/layouts/components/topbar/components/FullscreenToggle'
import MonochromeThemeModeToggler from '@/layouts/components/topbar/components/MonochromeThemeModeToggler'

const Topbar = () => {
  const { sidenavSize, updateSettings, showBackdrop } = useLayoutContext()

  const toggleSideNav = () => {
    const html = document.documentElement
    const currentSize = html.getAttribute('data-sidenav-size')

    if (currentSize === 'offcanvas') {
      html.classList.toggle('sidebar-enable')
      showBackdrop()
    } else if (sidenavSize=== 'compact') {
      updateSettings({sidenavSize:currentSize === 'compact' ? 'condensed' : 'compact'})
    } else {
      updateSettings({sidenavSize:currentSize === 'condensed' ? 'default' : 'condensed'})
    }
  }

  return (
    <header className="app-topbar">
      <Container fluid className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-topbar">
            <div className="logo-light">
              <span className="logo-lg">
                <Logo size="lg" />
              </span>
              <span className="logo-sm">
                <Logo size="sm" />
              </span>
            </div>

            <div className="logo-dark">
              <span className="logo-lg">
                <Logo size="lg" />
              </span>
              <span className="logo-sm">
                <Logo size="sm" />
              </span>
            </div>
          </div>

          <button onClick={toggleSideNav} className="sidenav-toggle-button btn btn-default btn-icon">
            <TbMenu4 className="fs-22" />
          </button>

          <MegaMenu />
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="app-search d-none d-xl-flex me-2">
            <FormControl type="search" className="topbar-search rounded-pill" name="search" placeholder="Quick Search..." />
            <LuSearch className="app-search-icon text-muted" />
          </div>

          <LanguageDropdown />

          <MessageDropdown />

          <ApplicationMenu />

          <ThemeToggler />

          <FullscreenToggle />

          <MonochromeThemeModeToggler />

          <UserProfile />

          <CustomizerToggler />
        </div>
      </Container>
    </header>
  )
}

export default Topbar

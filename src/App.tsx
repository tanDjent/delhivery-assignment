import { useState, type ReactElement } from 'react'
import { OverviewTab } from './playground/OverviewTab'
import { PropertiesTab } from './playground/PropertiesTab'
import { ShowcaseTab } from './playground/ShowcaseTab'
import { Tabs } from './playground/Tabs'
import './App.css'

type PageTab = 'overview' | 'properties' | 'showcase'

const PANELS: Record<PageTab, () => ReactElement> = {
  overview: OverviewTab,
  properties: PropertiesTab,
  showcase: ShowcaseTab,
}

function App() {
  const [tab, setTab] = useState<PageTab>('overview')
  const Panel = PANELS[tab]

  return (
    <main className="docs">
      <h1 className="docs__title">Badge</h1>

      <Tabs
        idPrefix="docs"
        aria-label="Badge documentation"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'properties', label: 'Properties' },
          { id: 'showcase', label: 'Showcase' },
        ]}
      />

      <div
        className="docs__panel"
        role="tabpanel"
        id={`docs-panel-${tab}`}
        aria-labelledby={`docs-tab-${tab}`}
      >
        <Panel />
      </div>
    </main>
  )
}

export default App

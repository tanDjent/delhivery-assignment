import { useState } from 'react'
import { OverviewTab } from './playground/OverviewTab'
import { PropertiesTab } from './playground/PropertiesTab'
import { Tabs } from './playground/Tabs'
import './App.css'

type PageTab = 'overview' | 'properties'

function App() {
  const [tab, setTab] = useState<PageTab>('overview')

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
        ]}
      />

      <div
        className="docs__panel"
        role="tabpanel"
        id={`docs-panel-${tab}`}
        aria-labelledby={`docs-tab-${tab}`}
      >
        {tab === 'overview' ? <OverviewTab /> : <PropertiesTab />}
      </div>
    </main>
  )
}

export default App

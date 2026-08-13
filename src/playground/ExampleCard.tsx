import { useState, type ReactNode } from 'react'
import { CodeBlock } from './CodeBlock'
import { Tabs } from './Tabs'

type ExampleTab = 'description' | 'code'

interface ExampleCardProps {
  title: string
  description: string
  code: string
  children: ReactNode
}

export function ExampleCard({
  title,
  description,
  code,
  children,
}: ExampleCardProps) {
  const [tab, setTab] = useState<ExampleTab>('description')
  const idPrefix = `example-${title.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <section className="example">
      <h4 className="example__title">{title}</h4>
      <div className="example__card">
        <div className="example__preview">{children}</div>
        <div className="example__footer">
          <Tabs
            appearance="panel"
            idPrefix={idPrefix}
            aria-label={`${title} details`}
            value={tab}
            onChange={setTab}
            items={[
              { id: 'description', label: 'Description' },
              { id: 'code', label: 'Code' },
            ]}
          />
          <div
            className="example__panel"
            role="tabpanel"
            id={`${idPrefix}-panel-${tab}`}
            aria-labelledby={`${idPrefix}-tab-${tab}`}
          >
            {tab === 'description' ? (
              <p className="example__description">{description}</p>
            ) : (
              <CodeBlock code={code} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

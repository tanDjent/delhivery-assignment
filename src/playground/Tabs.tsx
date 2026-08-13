export interface TabItem<T extends string> {
  id: T
  label: string
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  /** `page` is the underlined header nav, `panel` the smaller in-card switch. */
  appearance?: 'page' | 'panel'
  /** Namespaces the generated ids so several tab groups can share a page. */
  idPrefix: string
  'aria-label': string
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  appearance = 'page',
  idPrefix,
  'aria-label': ariaLabel,
}: TabsProps<T>) {
  return (
    <div
      className={`tabs tabs--${appearance}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${item.id}`}
          aria-selected={item.id === value}
          aria-controls={`${idPrefix}-panel-${item.id}`}
          className={`tabs__tab${item.id === value ? ' tabs__tab--active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

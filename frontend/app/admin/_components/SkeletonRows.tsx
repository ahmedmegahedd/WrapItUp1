interface SkeletonRowsProps {
  cols?: number
  rows?: number
}

export default function SkeletonRows({ cols = 5, rows = 5 }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri}>
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} style={{ padding: '14px 16px' }}>
              <div
                className="admin-skeleton"
                style={{
                  height: 14,
                  width: ci === 0 ? '70%' : ci === cols - 1 ? '50%' : '85%',
                  borderRadius: 4,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="admin-card">
          <div className="admin-skeleton" style={{ height: 12, width: '50%', marginBottom: 12 }} />
          <div className="admin-skeleton" style={{ height: 32, width: '70%', marginBottom: 8 }} />
          <div className="admin-skeleton" style={{ height: 10, width: '40%' }} />
        </div>
      ))}
    </div>
  )
}

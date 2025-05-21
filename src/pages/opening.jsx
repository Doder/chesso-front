import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { OpeningTree } from './opening-tree'
import { getOpening } from '@/api/openings'

export function Opening() {
  const { id } = useParams()
  const [opening, setOpening] = useState(null)

  useEffect(() => {
    const fetchOpening = async () => {
      try {
        const { data } = await getOpening(id)
        setOpening(data)
      } catch (error) {
        console.error('Error fetching opening:', error)
      }
    }

    fetchOpening()
  }, [id])

  return (
    <div className="">
      <div className="container mb-2">
        <h2 className="text-xl font-semibold">
          {opening?.name || 'Loading...'}
        </h2>
      </div>
      <OpeningTree openingId={id} side={opening?.side} />
    </div>
  )
}

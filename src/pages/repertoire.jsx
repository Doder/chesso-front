import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { OpeningTree } from './opening-tree'
import { getRepertoire } from '@/api/repertoire'

export function Repertoire() {
  const { id } = useParams()
  const [repertoire, setRepertoire] = useState(null)

  useEffect(() => {
    const fetchRepertoire = async () => {
      try {
        const { data } = await getRepertoire(id)
        setRepertoire(data)
      } catch (error) {
        console.error('Error fetching repertoire:', error)
      }
    }

    fetchRepertoire()
  }, [id])

  return (
    <div className="">
      <div className="container mb-2">
        <h2 className="text-xl font-semibold">
          {repertoire?.name || 'Loading...'}
        </h2>
      </div>
      <OpeningTree repertoireId={id} />
    </div>
  )
}

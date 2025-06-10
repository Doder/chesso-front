import {useParams} from 'react-router-dom'
import {useEffect, useState} from 'react'
import {OpeningTree} from './opening-tree'
import {getOpening} from '@/api/openings'
import {Breadcrumb} from '@/components/ui/breadcrumb'

export function Opening() {
  const {rid, oid} = useParams()
  const [opening, setOpening] = useState(null)

  useEffect(() => {
    const fetchOpening = async () => {
      try {
        const {data} = await getOpening(oid)
        setOpening(data)
      } catch (error) {
        console.error('Error fetching opening:', error)
      }
    }

    fetchOpening()
  }, [oid])

  const breadcrumbItems = [
    {label: 'Repertoires', href: '/repertoires'},
    {label: 'Openings', href: `/repertoire/${opening?.repertoire_id}`},
    {label: opening?.name || 'Loading...', href: null}
  ]

  return (
    <div className="">
      <div className="lg:container pt-2">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      {opening && <OpeningTree openingId={oid} openingName={opening.name} repertoireId={rid} side={opening.side} /> }
    </div>
  )
}

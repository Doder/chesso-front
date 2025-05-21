import { useParams } from 'react-router-dom'
import { OpeningTree } from './opening-tree'

export function Repertoire() {
  const { id } = useParams()

  return (
    <div>
      <OpeningTree repertoireId={id} />
    </div>
  )
}

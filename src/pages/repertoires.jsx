import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { DateTime } from 'luxon'
import { getRepertoires, createRepertoire } from '@/api/repertoire'
import { RepertoireModal } from '../components/repertoire-modal'
import { useNavigate } from 'react-router-dom'

export function Repertoires() {
  const [repertoires, setRepertoires] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRepertoires()
  }, [])

  const fetchRepertoires = async () => {
    try {
      const { data } = await getRepertoires()
      setRepertoires(data)
    } catch (error) {
      console.error('Error fetching repertoires:', error)
    }
  }

  const handleCreateRepertoire = async (data) => {
    try {
      await createRepertoire(data)
      fetchRepertoires()
    } catch (error) {
      console.error('Error creating repertoire:', error)
    }
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Repertoires</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Repertoire
        </button>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/5 border-b border-border">
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
              <th className="px-4 py-3 text-left font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {repertoires.map((repertoire) => (
              <tr 
                key={repertoire.ID} 
                className="border-b border-border last:border-0 hover:bg-secondary/5 cursor-pointer"
                onClick={() => navigate(`/repertoire/${repertoire.ID}`)}
              >
                <td className="px-4 py-3">{repertoire.name}</td>
                <td className="px-4 py-3">
                  {repertoire.CreatedAt && 
                    DateTime.fromISO(repertoire.CreatedAt, { zone: 'utc' })
                      .setZone('local')
                      .toFormat('dd.MM.yyyy HH:mm')
                  }
                </td>
                <td className="px-4 py-3">
                  {repertoire.UpdatedAt && 
                    DateTime.fromISO(repertoire.UpdatedAt, { zone: 'utc' })
                      .setZone('local')
                      .toFormat('dd.MM.yyyy HH:mm')
                  }
                </td>
              </tr>
            ))}
            {repertoires.length === 0 && (
              <tr>
                <td colSpan="2" className="px-4 py-3 text-center text-muted-foreground">
                  No repertoires found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <RepertoireModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRepertoire}
      />
    </div>
  )
}

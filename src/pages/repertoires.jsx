import { useState, useEffect } from 'react'
import { Plus, Trash2, PenIcon } from 'lucide-react'
import { DateTime } from 'luxon'
import { getRepertoires, createRepertoire, deleteRepertoire, updateRepertoire } from '@/api/repertoire'
import { RepertoireModal } from '../components/repertoire-modal'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function Repertoires() {
  const [repertoires, setRepertoires] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null })
  const [editingRepertoire, setEditingRepertoire] = useState(null)
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

  const handleEditRepertoire = async (data) => {
    try {
      await updateRepertoire(data, editingRepertoire.ID)
      fetchRepertoires()
    } catch (error) {
      console.error('Error editing repertoire:', error)
    }
  }

  const handleEditClick = (e, id) => {
    e.stopPropagation()
    setIsModalOpen(true)
    setEditingRepertoire(repertoires.find(r => r.ID === id))
  }

  const handleDeleteClick = (e, id) => {
    e.stopPropagation()
    setDeleteDialog({ open: true, id })
  }

  const handleDelete = async () => {
    if (deleteDialog.id) {
      try {
        await deleteRepertoire(deleteDialog.id)
        fetchRepertoires()
        setDeleteDialog({ open: false, id: null })
      } catch (error) {
        console.error('Error deleting repertoire:', error)
      }
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
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
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
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => handleEditClick(e, repertoire.ID)}
                    className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded"
                  >
                    <PenIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, repertoire.ID)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
        onSubmit={editingRepertoire ? handleEditRepertoire : handleCreateRepertoire}
        editingRepertoire={editingRepertoire}
        key={editingRepertoire?.ID || 'new'}
      />

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: open ? deleteDialog.id : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Repertoire</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this repertoire? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

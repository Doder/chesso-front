import { useState, useEffect } from 'react'
import { PenIcon, Plus, Trash2 } from 'lucide-react'
import { DateTime } from 'luxon'
import { getOpenings, createOpening, deleteOpening, updateOpening } from '@/api/openings'
import { OpeningModal } from '../components/opening-modal'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export function Openings() {
  const [openings, setOpenings] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null })
  const [editingOpening, setEditingOpening] = useState(null)
  const navigate = useNavigate()
  const { id: repertoireId } = useParams()

  useEffect(() => {
    fetchOpenings()
  }, [])

  const fetchOpenings = async () => {
    try {
      const { data } = await getOpenings(repertoireId)
      setOpenings(data.openings)
    } catch (error) {
      console.error('Error fetching openings:', error)
    }
  }

  const handleCreateOpening = async (data) => {
    try {
      await createOpening(data, Number(repertoireId))
      fetchOpenings()
    } catch (error) {
      console.error('Error creating opening:', error)
    }
  }

  const handleUpdateOpening = async (data) => {
    try {
      await updateOpening(data, Number(editingOpening.ID))
      fetchOpenings()
    } catch (error) {
      console.error('Error updating opening:', error)
    }
  }

  const handleDeleteClick = (e, id) => {
    e.stopPropagation()
    setDeleteDialog({ open: true, id })
  }

  const handleEditClick = (e, id) => {
    e.stopPropagation()
    setIsModalOpen(true)
    setEditingOpening(openings.find(o => o.ID === id))
  }

  const handleDelete = async () => {
    if (deleteDialog.id) {
      try {
        await deleteOpening(deleteDialog.id)
        fetchOpenings()
        setDeleteDialog({ open: false, id: null })
      } catch (error) {
        console.error('Error deleting opening:', error)
      }
    }
  }

  const breadcrumbItems = [
    { label: 'Repertoires', href: '/repertoires' },
    { label: 'Openings', href: null }
  ]

  return (
    <div className="container mx-auto py-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-semibold">Openings</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          New Opening
        </button>
      </div>
      
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {openings.map((opening) => (
          <div 
            key={opening.ID} 
            className="border border-border rounded-lg p-4 hover:bg-secondary/5 cursor-pointer"
            onClick={() => navigate(`opening/${opening.ID}`)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{opening.name}</h3>
                <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                  opening.side === 'w' 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-gray-800 text-white'
                }`}>
                  {opening.side === 'w' ? 'White' : 'Black'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleEditClick(e, opening.ID)}
                  className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded"
                >
                  <PenIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, opening.ID)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                Created: {opening.CreatedAt && 
                  DateTime.fromISO(opening.CreatedAt, { zone: 'utc' })
                    .setZone('local')
                    .toFormat('dd.MM.yyyy HH:mm')
                }
              </div>
              <div>
                Updated: {opening.UpdatedAt && 
                  DateTime.fromISO(opening.UpdatedAt, { zone: 'utc' })
                    .setZone('local')
                    .toFormat('dd.MM.yyyy HH:mm')
                }
              </div>
            </div>
          </div>
        ))}
        {openings.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No openings found
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/5 border-b border-border">
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Side</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
              <th className="px-4 py-3 text-left font-semibold">Updated</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {openings.map((opening) => (
              <tr 
                key={opening.ID} 
                className="border-b border-border last:border-0 hover:bg-secondary/5 cursor-pointer"
                onClick={() => navigate(`opening/${opening.ID}`)}
              >
                <td className="px-4 py-3">{opening.name}</td>
                <td className="px-4 py-3">{opening.side}</td>
                <td className="px-4 py-3">
                  {opening.CreatedAt && 
                    DateTime.fromISO(opening.CreatedAt, { zone: 'utc' })
                      .setZone('local')
                      .toFormat('dd.MM.yyyy HH:mm')
                  }
                </td>
                <td className="px-4 py-3">
                  {opening.UpdatedAt && 
                    DateTime.fromISO(opening.UpdatedAt, { zone: 'utc' })
                      .setZone('local')
                      .toFormat('dd.MM.yyyy HH:mm')
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => handleEditClick(e, opening.ID)}
                    className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded"
                  >
                    <PenIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, opening.ID)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {openings.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-3 text-center text-muted-foreground">
                  No openings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <OpeningModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingOpening ? handleUpdateOpening : handleCreateOpening}
        editingOpening={editingOpening}
        key={editingOpening?.ID || 'new'}
      />

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: open ? deleteDialog.id : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Opening</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this opening? This action cannot be undone.
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

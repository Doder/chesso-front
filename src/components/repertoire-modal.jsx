
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export function RepertoireModal({ isOpen, onClose, onSubmit, editingRepertoire }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingRepertoire?.name || '',
    },
  })

  const handleSubmit = async (values) => {
    await onSubmit(values)
    form.reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-background p-6 rounded-lg w-[400px]">
        <h2 className="text-lg font-semibold mb-4">{editingRepertoire ? 'Edit Repertoire' : 'Create New Repertoire'}</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      placeholder="Repertoire name"
                      className="w-full p-2 border border-border rounded"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded hover:bg-secondary/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                {editingRepertoire ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

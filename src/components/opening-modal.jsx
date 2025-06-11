import { useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  side: z.enum(['w', 'b'], {
    required_error: 'Please select a side',
  }),
})

export function OpeningModal({ isOpen, onClose, onSubmit, editingOpening}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingOpening?.name || '',
      side: editingOpening?.side || 'w',
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
        <h2 className="text-lg font-semibold mb-4">{editingOpening ? 'Edit Opening' : 'Create New Opening'}</h2>
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
                      placeholder="Opening name"
                      className="w-full p-2 border border-border rounded"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="side"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Side</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select side" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="w">White</SelectItem>
                      <SelectItem value="b">Black</SelectItem>
                    </SelectContent>
                  </Select>
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
                {editingOpening ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

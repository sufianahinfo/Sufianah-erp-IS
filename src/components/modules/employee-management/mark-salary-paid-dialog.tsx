import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface MarkSalaryPaidDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
  }
  
  export function MarkSalaryPaidDialog({ open, onOpenChange, onConfirm }: MarkSalaryPaidDialogProps) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Salary as Paid</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this salary record as paid?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>Mark as Paid</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
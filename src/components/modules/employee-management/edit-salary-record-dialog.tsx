import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type SalaryRecord  } from "@/lib/firebase-services"

interface EditSalaryRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    salaryRecord: SalaryRecord | null
    onSubmit: (record: SalaryRecord) => void
  }
  
  export function EditSalaryRecordDialog({ open, onOpenChange, salaryRecord, onSubmit }: EditSalaryRecordDialogProps) {
    const [editSalaryRecord, setEditSalaryRecord] = useState<SalaryRecord | null>(salaryRecord)
  
    useEffect(() => {
      setEditSalaryRecord(salaryRecord)
    }, [salaryRecord])
  
    if (!editSalaryRecord) return null
  
    const handleSubmit = () => {
      // Recalculate total
      const updatedRecord = {
        ...editSalaryRecord,
        totalSalary:
          (editSalaryRecord.basicSalary || 0) +
          (editSalaryRecord.commission || 0) +
          (editSalaryRecord.bonus || 0) -
          (editSalaryRecord.deductions || 0),
      }
      onSubmit(updatedRecord)
    }
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Salary Record</DialogTitle>
            <DialogDescription>Update salary, commission, bonus, or deductions</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Basic Salary</Label>
              <Input
                type="number"
                value={editSalaryRecord.basicSalary}
                onChange={(e) =>
                  setEditSalaryRecord({ ...editSalaryRecord, basicSalary: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Commission</Label>
              <Input
                type="number"
                value={editSalaryRecord.commission}
                onChange={(e) =>
                  setEditSalaryRecord({ ...editSalaryRecord, commission: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Bonus</Label>
              <Input
                type="number"
                value={editSalaryRecord.bonus}
                onChange={(e) =>
                  setEditSalaryRecord({ ...editSalaryRecord, bonus: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Deductions</Label>
              <Input
                type="number"
                value={editSalaryRecord.deductions}
                onChange={(e) =>
                  setEditSalaryRecord({ ...editSalaryRecord, deductions: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
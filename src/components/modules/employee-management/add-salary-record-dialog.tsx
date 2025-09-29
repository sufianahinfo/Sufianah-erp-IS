import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Employee } from "@/lib/firebase-services"

interface AddSalaryRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employees: Employee[]
    onSubmit: (employeeId: string, salaryData: {
      month: string
      basicSalary: number
      commission: number
      bonus: number
      deductions: number
    }) => void
  }
  
  export function AddSalaryRecordDialog({ open, onOpenChange, employees, onSubmit }: AddSalaryRecordDialogProps) {
    const [addSalaryEmployee, setAddSalaryEmployee] = useState<Employee | null>(null)
    const [addSalaryForm, setAddSalaryForm] = useState({
      month: "",
      basicSalary: "",
      commission: "",
      bonus: "",
      deductions: "",
    })
  
    const handleSubmit = () => {
      if (!addSalaryEmployee) return
  
      const basicSalary = Number(addSalaryForm.basicSalary)
      const commission = Number(addSalaryForm.commission)
      const bonus = Number(addSalaryForm.bonus)
      const deductions = Number(addSalaryForm.deductions)
  
      if (isNaN(basicSalary) || basicSalary < 0) return
  
      onSubmit(addSalaryEmployee.id, {
        month: addSalaryForm.month,
        basicSalary,
        commission,
        bonus,
        deductions,
      })
  
      setAddSalaryEmployee(null)
      setAddSalaryForm({
        month: "",
        basicSalary: "",
        commission: "",
        bonus: "",
        deductions: "",
      })
    }
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Salary Record</DialogTitle>
            <DialogDescription>Create a new salary record for an employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Employee</Label>
              <Select
                value={addSalaryEmployee?.id || ""}
                onValueChange={(value) => {
                  const employee = employees.find((emp) => emp.id === value)
                  setAddSalaryEmployee(employee || null)
                  if (employee) {
                    setAddSalaryForm({
                      month: new Date().toISOString().slice(0, 7),
                      basicSalary: employee.salary.toString(),
                      commission: "0",
                      bonus: "0",
                      deductions: "0",
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month (YYYY-MM)</Label>
              <Input
                type="month"
                value={addSalaryForm.month}
                onChange={(e) => setAddSalaryForm({ ...addSalaryForm, month: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Basic Salary</Label>
                <Input
                  type="number"
                  value={addSalaryForm.basicSalary}
                  onChange={(e) => setAddSalaryForm({ ...addSalaryForm, basicSalary: e.target.value })}
                />
              </div>
              <div>
                <Label>Commission</Label>
                <Input
                  type="number"
                  value={addSalaryForm.commission}
                  onChange={(e) => setAddSalaryForm({ ...addSalaryForm, commission: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bonus</Label>
                <Input
                  type="number"
                  value={addSalaryForm.bonus}
                  onChange={(e) => setAddSalaryForm({ ...addSalaryForm, bonus: e.target.value })}
                />
              </div>
              <div>
                <Label>Deductions</Label>
                <Input
                  type="number"
                  value={addSalaryForm.deductions}
                  onChange={(e) => setAddSalaryForm({ ...addSalaryForm, deductions: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Add Salary Record</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Edit, Trash2, Phone, Mail, DollarSign, Target, Clock, Award, Shield, UserCheck } from "lucide-react"
import { EmployeeService, type Employee, type AttendanceRecord, type SalaryRecord } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

import { AddEmployeeDialog } from "./modules/employee-management/add-employee-dialog"
import { EditEmployeeDialog } from "./modules/employee-management/edit-employee-dialog"
import { MarkAttendanceDialog } from "./modules/employee-management/mark-attendance-dialog"
import { EditSalaryRecordDialog } from "./modules/employee-management/edit-salary-record-dialog"
import { MarkSalaryPaidDialog } from "./modules/employee-management/mark-salary-paid-dialog"
import { RewardEmployeeDialog } from "./modules/employee-management/reward-employee-dialog"
import { SetTargetDialog } from "./modules/employee-management/set-target-dialog"
import { AddSalaryRecordDialog } from "./modules/employee-management/add-salary-record-dialog"

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Dialog states
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [isEditSalaryOpen, setIsEditSalaryOpen] = useState(false)
  const [editSalaryRecord, setEditSalaryRecord] = useState<SalaryRecord | null>(null)
  const [isMarkSalaryPaidOpen, setIsMarkSalaryPaidOpen] = useState(false)
  const [markSalaryRecord, setMarkSalaryRecord] = useState<SalaryRecord | null>(null)
  const [isRewardOpen, setIsRewardOpen] = useState(false)
  const [rewardEmployee, setRewardEmployee] = useState<Employee | null>(null)
  const [isSetTargetOpen, setIsSetTargetOpen] = useState(false)
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null)
  const [isAddSalaryOpen, setIsAddSalaryOpen] = useState(false)

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, attendanceData, salaryData] = await Promise.all([
          EmployeeService.getAllEmployees(),
          EmployeeService.getAllAttendanceRecords(),
          EmployeeService.getAllSalaryRecords(),
        ])
        setEmployees(employeesData)
        setAttendanceRecords(attendanceData)
        setSalaryRecords(salaryData)
        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load employee data. Please refresh the page.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const totalEmployees = employees.length
  const activeEmployees = employees.filter((emp) => emp.status === "active").length
  const totalMonthlySalary = employees.reduce((sum, emp) => sum + emp.salary, 0)
  const totalMonthlyCommission = employees.reduce((sum, emp) => sum + (emp.monthlySales * emp.commission) / 100, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":  
        return "secondary"
      case "on-leave":
        return "outline"
      default:
        return "outline"
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case "present":
        return "default"
      case "late":
        return "secondary"
      case "half-day":
        return "outline"
      case "absent":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Calculate attendance rate based on join date and attendance records
  const calculateAttendanceRate = (employee: Employee) => {
    if (!employee.joinDate) return 100

    const joinDate = new Date(employee.joinDate)
    const today = new Date()
    
    // Calculate working days (excluding weekends)
    let workingDays = 0
    const currentDate = new Date(joinDate)
    
    while (currentDate <= today) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        workingDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    if (workingDays <= 0) return 100

    // Count attendance records for this employee
    const employeeAttendance = attendanceRecords.filter(record => 
      record.employeeId === employee.id && 
      new Date(record.date) >= joinDate
    )

    // Count present days (including late and half-day as present)
    const presentDays = employeeAttendance.filter(record => 
      record.status === "present" || record.status === "late" || record.status === "half-day"
    ).length

    // Calculate attendance rate
    const attendanceRate = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 100
    return Math.min(100, Math.max(0, attendanceRate))
  }

  // Handler functions for dialogs
  const handleAddEmployee = async (employee: Omit<Employee, "id">) => {
    try {
      if (!employee.joinDate) {
        toast({
          title: "Missing Join Date",
          description: "Please select a join date for the employee.",
          variant: "destructive",
        })
        return
      }

      await EmployeeService.createEmployee(employee)
      setIsAddEmployeeOpen(false)

      toast({
        title: "Employee Added",
        description: "Employee has been successfully added to the system",
      })

      // Reload employees
      const updatedEmployees = await EmployeeService.getAllEmployees()
      setEmployees(updatedEmployees)
    } catch {
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditEmployee = async (employee: Employee) => {
    try {
      await EmployeeService.updateEmployee(employee.id, employee)
      setIsEditEmployeeOpen(false)
      setEditEmployee(null)
      toast({
        title: "Employee Updated",
        description: "Employee information has been updated.",
      })
      const updatedEmployees = await EmployeeService.getAllEmployees()
      setEmployees(updatedEmployees)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update employee.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAttendance = async (attendanceData: Omit<AttendanceRecord, "id" | "employeeName" | "date" | "hoursWorked">) => {
    try {
      const employee = employees.find((emp) => emp.id === attendanceData.employeeId)
      if (!employee) return

      const checkInTime = new Date(`2024-01-01 ${attendanceData.checkIn}`)
      const checkOutTime = new Date(`2024-01-01 ${attendanceData.checkOut}`)
      const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

      const attendanceRecord: Omit<AttendanceRecord, "id"> = {
        employeeId: attendanceData.employeeId,
        employeeName: employee.name,
        date: new Date().toISOString().split("T")[0],
        checkIn: attendanceData.checkIn,
        checkOut: attendanceData.checkOut,
        hoursWorked: Math.max(0, hoursWorked),
        status: attendanceData.status as "present" | "absent" | "late" | "half-day",
        notes: attendanceData.notes,
      }

      await EmployeeService.createAttendanceRecord(attendanceRecord)
      setIsAttendanceOpen(false)

      toast({
        title: "Attendance Marked",
        description: "Attendance has been successfully recorded",
      })

      // Reload attendance records
      const updatedAttendance = await EmployeeService.getAllAttendanceRecords()
      setAttendanceRecords(updatedAttendance)
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    try {
      await EmployeeService.deleteEmployee(id)
      toast({
        title: "Employee Deleted",
        description: "Employee has been successfully removed from the system",
      })

      // Reload employees
      const updatedEmployees = await EmployeeService.getAllEmployees()
      setEmployees(updatedEmployees)
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditSalaryRecord = async (record: SalaryRecord) => {
    try {
      await EmployeeService.updateSalaryRecord(record.id, record)
      setIsEditSalaryOpen(false)
      setEditSalaryRecord(null)
      toast({
        title: "Salary Record Updated",
        description: "Salary record has been updated.",
      })
      const updatedSalaryRecords = await EmployeeService.getAllSalaryRecords()
      setSalaryRecords(updatedSalaryRecords)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update salary record.",
        variant: "destructive",
      })
    }
  }

  const handleMarkSalaryPaid = async () => {
    if (!markSalaryRecord) return
    try {
      await EmployeeService.updateSalaryRecord(markSalaryRecord.id, {
        ...markSalaryRecord,
        status: "paid",
      })
      setIsMarkSalaryPaidOpen(false)
      setMarkSalaryRecord(null)
      toast({
        title: "Salary Marked as Paid",
        description: "Salary record has been marked as paid.",
      })
      const updatedSalaryRecords = await EmployeeService.getAllSalaryRecords()
      setSalaryRecords(updatedSalaryRecords)
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark salary as paid.",
        variant: "destructive",
      })
    }
  }

  const handleRewardEmployee = async (amount: number) => {
    if (!rewardEmployee) return
    try {
      // Add reward as a bonus in salary record for current month
      const month = new Date().toISOString().slice(0, 7)
      // Find or create salary record for this employee/month
      const salaryRecord = salaryRecords.find(
        (rec) => rec.employeeId === rewardEmployee.id && rec.month === month
      )
      if (!salaryRecord) {
        // Create a new salary record
        const newRecord: Omit<SalaryRecord, "id"> = {
          employeeId: rewardEmployee.id,
          employeeName: rewardEmployee.name,
          month,
          basicSalary: rewardEmployee.salary,
          commission: Math.round((rewardEmployee.monthlySales * rewardEmployee.commission) / 100),
          bonus: amount,
          deductions: 0,
          totalSalary:
            rewardEmployee.salary +
            Math.round((rewardEmployee.monthlySales * rewardEmployee.commission) / 100) +
            amount,
          status: "pending",
        }
        await EmployeeService.createSalaryRecord(newRecord)
      } else {
        // Update bonus and total
        const updatedRecord = {
          ...salaryRecord,
          bonus: (salaryRecord.bonus || 0) + amount,
          totalSalary:
            (salaryRecord.basicSalary || 0) +
            (salaryRecord.commission || 0) +
            ((salaryRecord.bonus || 0) + amount) -
            (salaryRecord.deductions || 0),
        }
        await EmployeeService.updateSalaryRecord(salaryRecord.id, updatedRecord)
      }
      setIsRewardOpen(false)
      setRewardEmployee(null)
      toast({
        title: "Reward Added",
        description: "Reward/bonus has been added to the employee's salary.",
      })
      const updatedSalaryRecords = await EmployeeService.getAllSalaryRecords()
      setSalaryRecords(updatedSalaryRecords)
    } catch {
      toast({
        title: "Error",
        description: "Failed to add reward.",
        variant: "destructive",
      })
    }
  }

  const handleSetTarget = async (target: number) => {
    if (!targetEmployee) return
    try {
      await EmployeeService.updateEmployee(targetEmployee.id, {
        ...targetEmployee,
        monthlyTarget: target,
      })
      setIsSetTargetOpen(false)
      setTargetEmployee(null)
      toast({
        title: "Target Updated",
        description: "Monthly sales target has been updated.",
      })
      const updatedEmployees = await EmployeeService.getAllEmployees()
      setEmployees(updatedEmployees)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update target.",
        variant: "destructive",
      })
    }
  }

  const handleAddSalaryRecord = async (employeeId: string, salaryData: {
    month: string
    basicSalary: number
    commission: number
    bonus: number
    deductions: number
  }) => {
    try {
      const employee = employees.find((emp) => emp.id === employeeId)
      if (!employee) return

      const newSalaryRecord: Omit<SalaryRecord, "id"> = {
        employeeId: employee.id,
        employeeName: employee.name,
        month: salaryData.month,
        basicSalary: salaryData.basicSalary,
        commission: salaryData.commission,
        bonus: salaryData.bonus,
        deductions: salaryData.deductions,
        totalSalary: salaryData.basicSalary + salaryData.commission + salaryData.bonus - salaryData.deductions,
        status: "pending",
      }

      await EmployeeService.createSalaryRecord(newSalaryRecord)
      setIsAddSalaryOpen(false)

      toast({
        title: "Salary Record Added",
        description: "Salary record has been created successfully.",
      })

      // Reload salary records
      const updatedSalaryRecords = await EmployeeService.getAllSalaryRecords()
      setSalaryRecords(updatedSalaryRecords)
    } catch {
      toast({
        title: "Error",
        description: "Failed to create salary record. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* All Dialog Components */}
      <AddEmployeeDialog
        open={isAddEmployeeOpen}
        onOpenChange={setIsAddEmployeeOpen}
        onSubmit={handleAddEmployee}
      />

      <EditEmployeeDialog
        open={isEditEmployeeOpen}
        onOpenChange={setIsEditEmployeeOpen}
        employee={editEmployee}
        onSubmit={handleEditEmployee}
      />

      <MarkAttendanceDialog
        open={isAttendanceOpen}
        onOpenChange={setIsAttendanceOpen}
        employees={employees}
        onSubmit={handleMarkAttendance}
      />

      <EditSalaryRecordDialog
        open={isEditSalaryOpen}
        onOpenChange={setIsEditSalaryOpen}
        salaryRecord={editSalaryRecord}
        onSubmit={handleEditSalaryRecord}
      />

      <MarkSalaryPaidDialog
        open={isMarkSalaryPaidOpen}
        onOpenChange={setIsMarkSalaryPaidOpen}
        onConfirm={handleMarkSalaryPaid}
      />

      <RewardEmployeeDialog
        open={isRewardOpen}
        onOpenChange={setIsRewardOpen}
        onSubmit={handleRewardEmployee}
      />

      <SetTargetDialog
        open={isSetTargetOpen}
        onOpenChange={setIsSetTargetOpen}
        onSubmit={handleSetTarget}
      />

      <AddSalaryRecordDialog
        open={isAddSalaryOpen}
        onOpenChange={setIsAddSalaryOpen}
        employees={employees}
        onSubmit={handleAddSalaryRecord}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Employee Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAttendanceOpen(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>

          <Button onClick={() => setIsAddEmployeeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{activeEmployees} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Salary Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalMonthlySalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Base salaries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalMonthlyCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Performance based</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.length > 0
                ? Math.round(employees.reduce((sum, emp) => sum + emp.performanceScore, 0) / employees.length)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Employee Management</h3>
            <p className="text-sm text-muted-foreground">Manage employees, attendance, payroll, and performance</p>
          </div>
        </div>
        
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="employees">👥 Employees</TabsTrigger>
            <TabsTrigger value="attendance">⏰ Attendance</TabsTrigger>
            <TabsTrigger value="payroll">💰 Payroll</TabsTrigger>
            <TabsTrigger value="performance">📈 Performance</TabsTrigger>
          </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Directory
              </CardTitle>
              <CardDescription>Manage employee information and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">Joined: {employee.joinDate}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {employee.role === 'admin' ? (
                              <Badge variant="default" className="bg-blue-600">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Cashier
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {employee.phone}
                            </p>
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {employee.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Rs{employee.salary.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{employee.commission}% commission</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Score:</span>
                              <span className={getPerformanceColor(employee.performanceScore)}>
                                {employee.performanceScore}%
                              </span>
                            </div>
                            <Progress value={employee.performanceScore} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Sales: Rs{employee.monthlySales.toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="font-medium">{calculateAttendanceRate(employee)}%</p>
                            <p className="text-xs text-muted-foreground">
                              {attendanceRecords.filter(record => 
                                record.employeeId === employee.id && 
                                (record.status === "present" || record.status === "late" || record.status === "half-day")
                              ).length} days present
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(employee.status) as "destructive" | "default" | "secondary" | "outline" | null | undefined}>{employee.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditEmployee(employee)
                                setIsEditEmployeeOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(`tel:${employee.phone}`, "_blank")
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteEmployee(employee.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Attendance Records
              </CardTitle>
              <CardDescription>Track employee attendance and working hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <p className="font-medium">{record.employeeName}</p>
                        </TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.checkIn}</TableCell>
                        <TableCell>{record.checkOut}</TableCell>
                        <TableCell>{record.hoursWorked.toFixed(1)} hrs</TableCell>
                        <TableCell>
                          <Badge variant={getAttendanceColor(record.status) as "destructive" | "default" | "secondary" | "outline" | null | undefined}>{record.status}</Badge>
                        </TableCell>
                        <TableCell>{record.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Salary Records
                  </CardTitle>
                  <CardDescription>Manage employee salaries and commission payments</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setIsAddSalaryOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Salary Record
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Basic Salary</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <p className="font-medium">{record.employeeName}</p>
                        </TableCell>
                        <TableCell>{record.month}</TableCell>
                        <TableCell>Rs{record.basicSalary.toLocaleString()}</TableCell>
                        <TableCell>Rs{record.commission.toLocaleString()}</TableCell>
                        <TableCell>Rs{record.bonus.toLocaleString()}</TableCell>
                        <TableCell>Rs{record.deductions.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="font-medium">Rs{record.totalSalary.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "paid"
                                ? "default"
                                : record.status === "pending"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMarkSalaryRecord(record)
                                setIsMarkSalaryPaidOpen(true)
                              }}
                              disabled={record.status === "paid"}
                              title={record.status === "paid" ? "Already paid" : "Mark as paid"}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditSalaryRecord(record)
                                setIsEditSalaryOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {employees.map((employee) => (
              <Card key={employee.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p>{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Sales</p>
                      <p className="text-lg font-bold">Rs{employee.monthlySales.toLocaleString()}</p>
                      <Progress value={(employee.monthlySales / employee.monthlyTarget) * 100} className="h-2 mt-1" />
                      <p className="text-xs text-muted-foreground">
                        Target: Rs{employee.monthlyTarget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Performance Score</p>
                      <p className={`text-lg font-bold ${getPerformanceColor(employee.performanceScore)}`}>
                        {employee.performanceScore}%
                      </p>
                      <Progress value={employee.performanceScore} className="h-2 mt-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <p className="text-lg font-bold">{calculateAttendanceRate(employee)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Commission</p>
                      <p className="text-lg font-bold">Rs{employee.totalCommission.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRewardEmployee(employee)
                        setIsRewardOpen(true)
                      }}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Reward
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTargetEmployee(employee)
                        setIsSetTargetOpen(true)
                      }}
                    >
                      <Target className="h-4 w-4 mr-1" />
                      Set Target
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


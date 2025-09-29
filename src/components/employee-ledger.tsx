"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EmployeeLedgerService, EmployeeAdvanceService, SalespersonBonusService, EmployeeService, type EmployeeLedgerEntry, type EmployeeAdvance, type SalespersonBonus, type Employee } from "@/lib/firebase-services"

export function EmployeeLedger() {
  const [ledgerEntries, setLedgerEntries] = useState<EmployeeLedgerEntry[]>([])
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([])
  const [bonuses, setBonuses] = useState<SalespersonBonus[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false)
  const [isAddBonusOpen, setIsAddBonusOpen] = useState(false)
  const { toast } = useToast()

  // Form states
  const [newEntry, setNewEntry] = useState({
    employeeId: "",
    employeeName: "",
    type: "salary" as const,
    amount: 0,
    description: "",
    date: new Date().toISOString().split('T')[0],
    status: "pending" as const
  })

  const [newAdvance, setNewAdvance] = useState({
    employeeId: "",
    employeeName: "",
    amount: 0,
    reason: "",
    requestedDate: new Date().toISOString().split('T')[0],
    status: "pending" as const,
    notes: ""
  })

  const [newBonus, setNewBonus] = useState({
    employeeId: "",
    employeeName: "",
    period: "",
    salesTarget: 0,
    actualSales: 0,
    bonusRate: 0,
    bonusAmount: 0,
    status: "pending" as const
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [ledgerData, advancesData, bonusesData, employeesData] = await Promise.all([
        EmployeeLedgerService.getAllLedgerEntries(),
        EmployeeAdvanceService.getAllAdvances(),
        SalespersonBonusService.getAllBonuses(),
        EmployeeService.getAllEmployees()
      ])
      
      setLedgerEntries(ledgerData)
      setAdvances(advancesData)
      setBonuses(bonusesData)
      setEmployees(employeesData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddEntry = async () => {
    try {
      if (!newEntry.employeeId || !newEntry.amount || !newEntry.description) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      await EmployeeLedgerService.addLedgerEntry(newEntry)
      toast({
        title: "Success",
        description: "Ledger entry added successfully.",
      })
      setIsAddEntryOpen(false)
      setNewEntry({
        employeeId: "",
        employeeName: "",
        type: "salary",
        amount: 0,
        description: "",
        date: new Date().toISOString().split('T')[0],
        status: "pending"
      })
      loadData()
    } catch (error) {
      console.error("Error adding entry:", error)
      toast({
        title: "Error",
        description: "Failed to add ledger entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddAdvance = async () => {
    try {
      if (!newAdvance.employeeId || !newAdvance.amount || !newAdvance.reason) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      await EmployeeAdvanceService.addAdvance(newAdvance)
      toast({
        title: "Success",
        description: "Advance request added successfully.",
      })
      setIsAddAdvanceOpen(false)
      setNewAdvance({
        employeeId: "",
        employeeName: "",
        amount: 0,
        reason: "",
        requestedDate: new Date().toISOString().split('T')[0],
        status: "pending",
        notes: ""
      })
      loadData()
    } catch (error) {
      console.error("Error adding advance:", error)
      toast({
        title: "Error",
        description: "Failed to add advance request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddBonus = async () => {
    try {
      if (!newBonus.employeeId || !newBonus.period || !newBonus.salesTarget) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      // Calculate bonus amount
      const bonusAmount = Math.max(0, (newBonus.actualSales - newBonus.salesTarget) * (newBonus.bonusRate / 100))
      const bonusData = { ...newBonus, bonusAmount }

      await SalespersonBonusService.addBonus(bonusData)
      toast({
        title: "Success",
        description: "Bonus record added successfully.",
      })
      setIsAddBonusOpen(false)
      setNewBonus({
        employeeId: "",
        employeeName: "",
        period: "",
        salesTarget: 0,
        actualSales: 0,
        bonusRate: 0,
        bonusAmount: 0,
        status: "pending"
      })
      loadData()
    } catch (error) {
      console.error("Error adding bonus:", error)
      toast({
        title: "Error",
        description: "Failed to add bonus record. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (employee) {
      setNewEntry(prev => ({ ...prev, employeeId, employeeName: employee.name }))
      setNewAdvance(prev => ({ ...prev, employeeId, employeeName: employee.name }))
      setNewBonus(prev => ({ ...prev, employeeId, employeeName: employee.name }))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock },
      approved: { variant: "default" as const, icon: CheckCircle },
      paid: { variant: "default" as const, icon: CheckCircle },
      cancelled: { variant: "destructive" as const, icon: XCircle },
      rejected: { variant: "destructive" as const, icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredLedgerEntries = ledgerEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEmployee = selectedEmployee === "all" || entry.employeeId === selectedEmployee
    const matchesType = selectedType === "all" || entry.type === selectedType
    return matchesSearch && matchesEmployee && matchesType
  })

  const filteredAdvances = advances.filter(advance => {
    const matchesSearch = advance.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         advance.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEmployee = selectedEmployee === "all" || advance.employeeId === selectedEmployee
    return matchesSearch && matchesEmployee
  })

  const filteredBonuses = bonuses.filter(bonus => {
    const matchesSearch = bonus.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bonus.period.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEmployee = selectedEmployee === "all" || bonus.employeeId === selectedEmployee
    return matchesSearch && matchesEmployee
  })

  const totalLedgerAmount = filteredLedgerEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const totalAdvanceAmount = filteredAdvances.reduce((sum, advance) => sum + advance.amount, 0)
  const totalBonusAmount = filteredBonuses.reduce((sum, bonus) => sum + bonus.bonusAmount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employee ledger data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Ledger</h2>
          <p className="text-muted-foreground">
            Manage employee financial records, advances, and bonuses
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Ledger Entry</DialogTitle>
                <DialogDescription>
                  Add a new financial entry for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select onValueChange={handleEmployeeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select onValueChange={(value) => setNewEntry(prev => ({ ...prev, type: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="commission">Commission</SelectItem>
                      <SelectItem value="deduction">Deduction</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <Button onClick={handleAddEntry} className="w-full">
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddAdvanceOpen} onOpenChange={setIsAddAdvanceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Advance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Advance Request</DialogTitle>
                <DialogDescription>
                  Add a new advance request for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select onValueChange={handleEmployeeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newAdvance.amount}
                    onChange={(e) => setNewAdvance(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={newAdvance.reason}
                    onChange={(e) => setNewAdvance(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for advance"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newAdvance.notes}
                    onChange={(e) => setNewAdvance(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes (optional)"
                  />
                </div>
                <Button onClick={handleAddAdvance} className="w-full">
                  Add Advance Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddBonusOpen} onOpenChange={setIsAddBonusOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Bonus
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Salesperson Bonus</DialogTitle>
                <DialogDescription>
                  Add a new bonus record for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select onValueChange={handleEmployeeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="period">Period (YYYY-MM)</Label>
                  <Input
                    id="period"
                    type="month"
                    value={newBonus.period}
                    onChange={(e) => setNewBonus(prev => ({ ...prev, period: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salesTarget">Sales Target</Label>
                    <Input
                      id="salesTarget"
                      type="number"
                      value={newBonus.salesTarget}
                      onChange={(e) => setNewBonus(prev => ({ ...prev, salesTarget: Number(e.target.value) }))}
                      placeholder="Target amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="actualSales">Actual Sales</Label>
                    <Input
                      id="actualSales"
                      type="number"
                      value={newBonus.actualSales}
                      onChange={(e) => setNewBonus(prev => ({ ...prev, actualSales: Number(e.target.value) }))}
                      placeholder="Actual amount"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bonusRate">Bonus Rate (%)</Label>
                  <Input
                    id="bonusRate"
                    type="number"
                    value={newBonus.bonusRate}
                    onChange={(e) => setNewBonus(prev => ({ ...prev, bonusRate: Number(e.target.value) }))}
                    placeholder="Bonus percentage"
                  />
                </div>
                <Button onClick={handleAddBonus} className="w-full">
                  Add Bonus Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ledger Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalLedgerAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredLedgerEntries.length} entries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advances</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAdvanceAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredAdvances.length} requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBonusAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredBonuses.length} bonuses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="salary">Salary</SelectItem>
            <SelectItem value="advance">Advance</SelectItem>
            <SelectItem value="bonus">Bonus</SelectItem>
            <SelectItem value="commission">Commission</SelectItem>
            <SelectItem value="deduction">Deduction</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ledger" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ledger">Ledger Entries</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
          <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ledger Entries</CardTitle>
              <CardDescription>
                All financial entries for employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLedgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.employeeName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>${entry.amount.toLocaleString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLedgerEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No ledger entries found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advance Requests</CardTitle>
              <CardDescription>
                Employee advance requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdvances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell className="font-medium">{advance.employeeName}</TableCell>
                      <TableCell>${advance.amount.toLocaleString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{advance.reason}</TableCell>
                      <TableCell>{new Date(advance.requestedDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(advance.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredAdvances.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No advance requests found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Salesperson Bonuses</CardTitle>
              <CardDescription>
                Bonus records based on sales performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Bonus Rate</TableHead>
                    <TableHead>Bonus Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBonuses.map((bonus) => (
                    <TableRow key={bonus.id}>
                      <TableCell className="font-medium">{bonus.employeeName}</TableCell>
                      <TableCell>{bonus.period}</TableCell>
                      <TableCell>${bonus.salesTarget.toLocaleString()}</TableCell>
                      <TableCell>${bonus.actualSales.toLocaleString()}</TableCell>
                      <TableCell>{bonus.bonusRate}%</TableCell>
                      <TableCell>${bonus.bonusAmount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(bonus.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredBonuses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No bonus records found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

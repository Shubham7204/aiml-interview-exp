"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBatches } from "../lib/database"
import { useEffect, useState } from "react"
import type { Batch } from "../types/company"

interface BatchSelectorProps {
  onBatchSelect: (batchId: string) => void
  selectedBatch?: string
}

export function BatchSelector({ onBatchSelect, selectedBatch }: BatchSelectorProps) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBatches() {
      try {
        const fetchedBatches = await getBatches()
        setBatches(fetchedBatches.filter((batch) => batch.isActive))
      } catch (error) {
        console.error("Error loading batches:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBatches()
  }, [])

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Loading batches..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={selectedBatch} onValueChange={onBatchSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a batch" />
      </SelectTrigger>
      <SelectContent>
        {batches.map((batch) => (
          <SelectItem key={batch.id} value={batch.id}>
            <div className="flex items-center gap-3">
              <span>
                {batch.name} ({batch.year})
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * WriteConflictDetector — Detects and resolves concurrent conflicting writes during Split-Brain partitions
 */

export interface WriteRecord {
  key: string;
  value: string;
  nodeId: string;
  lsn: number;
  timestamp: number;
}

export interface WriteConflict {
  id: string;
  key: string;
  primaryWrite: WriteRecord;
  divergentWrite: WriteRecord;
  detectedAt: number;
  resolved: boolean;
  resolutionStrategy?: 'lww' | 'highest_lsn' | 'manual';
  winningValue?: string;
}

export class WriteConflictDetector {
  private keyRecords: Map<string, WriteRecord[]> = new Map();
  private conflicts: WriteConflict[] = [];
  private nextConflictId: number = 1;

  public recordWrite(
    key: string,
    value: string,
    nodeId: string,
    lsn: number,
    isSplitBrain: boolean
  ): WriteConflict | null {
    const now = Date.now();
    const newRecord: WriteRecord = {
      key,
      value,
      nodeId,
      lsn,
      timestamp: now,
    };

    let existingList = this.keyRecords.get(key);
    if (!existingList) {
      existingList = [];
      this.keyRecords.set(key, existingList);
    }

    // If split brain is active and another node has also written to this key
    if (isSplitBrain && existingList.length > 0) {
      const priorWrite = existingList[existingList.length - 1];
      if (priorWrite.nodeId !== nodeId && priorWrite.value !== value) {
        // Conflicting concurrent mutation detected!
        const conflict: WriteConflict = {
          id: `conflict-${this.nextConflictId++}`,
          key,
          primaryWrite: priorWrite,
          divergentWrite: newRecord,
          detectedAt: now,
          resolved: false,
        };
        this.conflicts.unshift(conflict);
        existingList.push(newRecord);
        return conflict;
      }
    }

    existingList.push(newRecord);
    return null;
  }

  public getConflicts(): WriteConflict[] {
    return [...this.conflicts];
  }

  public getUnresolvedConflicts(): WriteConflict[] {
    return this.conflicts.filter((c) => !c.resolved);
  }

  public resolveConflict(
    conflictId: string,
    strategy: 'lww' | 'highest_lsn' | 'manual',
    manualWinningValue?: string
  ): WriteConflict | null {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict || conflict.resolved) return null;

    conflict.resolved = true;
    conflict.resolutionStrategy = strategy;

    if (strategy === 'lww') {
      // Last-Write-Wins based on physical timestamp
      conflict.winningValue =
        conflict.divergentWrite.timestamp >= conflict.primaryWrite.timestamp
          ? conflict.divergentWrite.value
          : conflict.primaryWrite.value;
    } else if (strategy === 'highest_lsn') {
      // Highest WAL sequence number wins
      conflict.winningValue =
        conflict.divergentWrite.lsn >= conflict.primaryWrite.lsn
          ? conflict.divergentWrite.value
          : conflict.primaryWrite.value;
    } else {
      conflict.winningValue = manualWinningValue || conflict.primaryWrite.value;
    }

    return conflict;
  }

  public resolveAll(strategy: 'lww' | 'highest_lsn' = 'lww'): number {
    let resolvedCount = 0;
    for (const conflict of this.conflicts) {
      if (!conflict.resolved) {
        this.resolveConflict(conflict.id, strategy);
        resolvedCount++;
      }
    }
    return resolvedCount;
  }

  public clear(): void {
    this.keyRecords.clear();
    this.conflicts = [];
  }
}

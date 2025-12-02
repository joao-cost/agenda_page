import { Appointment } from "../types";

export interface AppointmentLayout extends Appointment {
    style: {
        left: string;
        width: string;
    };
}

export function calculateAppointmentLayout(appointments: Appointment[]): AppointmentLayout[] {
    if (appointments.length === 0) return [];

    // 1. Sort by start time, then duration (longer first)
    const sorted = [...appointments].sort((a, b) => {
        const startA = new Date(a.date).getTime();
        const startB = new Date(b.date).getTime();
        if (startA !== startB) return startA - startB;
        return b.service.durationMin - a.service.durationMin;
    });

    // Helper to get times
    const getTimes = (apt: Appointment) => {
        const start = new Date(apt.date).getTime();
        const end = start + apt.service.durationMin * 60 * 1000;
        return { start, end };
    };

    // 2. Assign columns
    // We track the end time of the last event in each column
    const columnEndTimes: number[] = [];
    const withColumn = sorted.map((apt) => {
        const { start, end } = getTimes(apt);
        let colIndex = -1;

        // Find first column that is free
        for (let i = 0; i < columnEndTimes.length; i++) {
            if (columnEndTimes[i] <= start) {
                colIndex = i;
                break;
            }
        }

        if (colIndex === -1) {
            // Create new column
            colIndex = columnEndTimes.length;
            columnEndTimes.push(end);
        } else {
            // Update column end time
            columnEndTimes[colIndex] = end;
        }

        return { apt, colIndex, start, end };
    });

    // 3. Group into clusters to determine width
    // A cluster is a group of overlapping events
    const result: AppointmentLayout[] = [];
    let cluster: typeof withColumn = [];
    let clusterEnd = 0;

    for (const item of withColumn) {
        if (cluster.length === 0) {
            cluster.push(item);
            clusterEnd = item.end;
        } else {
            // If this event starts before the cluster ends, it overlaps (or is part of the visual group)
            if (item.start < clusterEnd) {
                cluster.push(item);
                clusterEnd = Math.max(clusterEnd, item.end);
            } else {
                // Process previous cluster
                processCluster(cluster, result);
                // Start new cluster
                cluster = [item];
                clusterEnd = item.end;
            }
        }
    }
    // Process last cluster
    if (cluster.length > 0) {
        processCluster(cluster, result);
    }

    return result;
}

function processCluster(
    cluster: { apt: Appointment; colIndex: number }[],
    result: AppointmentLayout[]
) {
    // Find max column index in this cluster
    const maxCol = Math.max(...cluster.map((c) => c.colIndex));
    const totalCols = maxCol + 1;
    const width = 100 / totalCols;

    for (const item of cluster) {
        result.push({
            ...item.apt,
            style: {
                left: `${item.colIndex * width}%`,
                width: `${width}%`
            }
        });
    }
}

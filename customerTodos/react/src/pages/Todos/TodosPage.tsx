import React, { useEffect, useMemo, useState } from 'react';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import {
  Chart,
  ChartCategoryAxis,
  ChartCategoryAxisItem,
  ChartLegend,
  ChartSeries,
  ChartSeriesItem,
} from '@progress/kendo-react-charts';
import { c3Action } from '@/c3Action';
import { ProjectRollup, Todo } from '@/Interfaces';
import { useErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';

const TODO_LIMIT = 500;

export default function TodosPage() {
  const { reportError } = useErrorBoundary();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [rollup, setRollup] = useState<ProjectRollup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [todoResult, rollupResult] = await Promise.all([
          c3Action('Todo', 'fetch', [{ include: 'this', limit: TODO_LIMIT }]),
          c3Action('Todo', 'projectRollup', []),
        ]);
        if (!cancelled) {
          setTodos(todoResult.objs);
          setRollup(rollupResult);
        }
      } catch (err) {
        reportError(err);
        if (!cancelled) setError(typeof err === 'string' ? err : 'Failed to load todos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reportError]);

  const rows = useMemo(() => todos.map((todo) => ({ ...todo, dueDate: new Date(todo.dueDate) })), [todos]);
  const projects = useMemo(() => rollup.map((row) => row.customerProject), [rollup]);
  const open = useMemo(() => rollup.map((row) => row.NotStarted + row.InProgress + row.Blocked), [rollup]);
  const overdue = useMemo(() => rollup.map((row) => row.overdue), [rollup]);

  if (loading) return <p className="p-6 text-secondary">Loading todos...</p>;
  if (error) return <p className="p-6 text-danger">{error}</p>;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Customer Todos</h1>
        <p className="mt-1 text-sm text-secondary">
          Only the current status is kept. Earlier states are not recorded.
        </p>
      </div>
      <section>
        <h2 className="mb-2 text-lg font-medium">Open vs overdue by customer project</h2>
        <Chart>
          <ChartLegend position="bottom" />
          <ChartCategoryAxis>
            <ChartCategoryAxisItem categories={projects} />
          </ChartCategoryAxis>
          <ChartSeries>
            <ChartSeriesItem type="column" name="Open" data={open} />
            <ChartSeriesItem type="column" name="Overdue" data={overdue} />
          </ChartSeries>
        </Chart>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium">Todos</h2>
        <Grid data={rows} className="w-full">
          <GridColumn field="name" title="Title" />
          <GridColumn field="customerProject" title="Customer Project" />
          <GridColumn field="owner" title="Owner" />
          <GridColumn field="dueDate" title="Due Date" format="{0:d}" />
          <GridColumn field="status" title="Status" />
        </Grid>
      </section>
    </div>
  );
}


import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import "../../Estilos/StatisticsPage.css";

// Colores para gráfico de tarta
const pieColors = ["#4caf50", "#ff9800", "#f44336"];

function StatisticsPage({ books }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Obtener años únicos de libros leídos
  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        books
          .filter(b => b.status === "Leído" && b.endDate)
          .map(b => new Date(b.endDate).getFullYear())
      )
    ).sort((a, b) => b - a);
  }, [books]);

  // Gráfico de barras: libros leídos por mes en el año seleccionado
  const booksByMonth = useMemo(() => {
    const months = Array(12).fill(0);  
    
    books.forEach(book => {
      if (book.status === "Leído" && book.endDate) {
        const date = new Date(book.endDate);
        if (date.getFullYear() === selectedYear) {
          months[date.getMonth()] += 1;
        }
      }
    });
    return months.map((count, idx) => ({
      month: new Date(0, idx).toLocaleString("default", { month: "short" }),
      count,
    }));
  }, [books, selectedYear]);
  // Total libros leidos año
    const totalReadThisYear = booksByMonth.reduce((sum, m) => sum + m.count, 0);

  // Gráfico de tarta: leídos / no leídos / no terminados
  const pieData = useMemo(() => {
    const counts = { "Leído": 0, "No leído": 0, "No terminado": 0, "Leyendo": 0 };
    books.forEach(book => {
      if (counts[book.status] !== undefined) {
        counts[book.status]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [books]);

  // Top 10 autores y editoriales
  const topEntities = (key) => {
    const counts = {};
    books.forEach(book => {
      const value = book[key];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  };

  const topAuthors = topEntities("author");
  const topPublishers = topEntities("publisher");

  return (
    <div className="statistics-container">
      <h1 className="statistics-title">Estadísticas de lectura</h1>

      <div className="statistics-grid">
        <div className="statistics-card">
          <h2 style={{marginBottom: 8}}>Libros leídos por mes</h2>
          <label style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <span>Año:</span>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span>Total: <strong>{totalReadThisYear}</strong> libros</span>
          </label>
          <div className="statistics-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={booksByMonth}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="statistics-card">
          <h2 style={{marginBottom: 8}}>Distribución por estado</h2>
          <div className="statistics-chart">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="statistics-grid" style={{marginTop: 24}}>
        <div className="statistics-card">
          <h2 style={{marginBottom: 8}}>Top 10 Autores</h2>
          <table className="statistics-table">
            <thead>
              <tr><th>Autor</th><th>Libros</th></tr>
            </thead>
            <tbody>
              {topAuthors.map(a => (
                <tr key={a.name}>
                  <td>{a.name}</td>
                  <td>{a.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="statistics-card">
          <h2 style={{marginBottom: 8}}>Top 10 Editoriales</h2>
          <table className="statistics-table">
            <thead>
              <tr><th>Editorial</th><th>Libros</th></tr>
            </thead>
            <tbody>
              {topPublishers.map(p => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StatisticsPage;

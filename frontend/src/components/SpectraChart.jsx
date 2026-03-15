import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SpectraChart({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animation for performance on rapid streaming
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: false,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#9CA3AF',
          maxTicksLimit: 10
        },
        title: {
          display: true,
          text: 'Wavelength (nm)',
          color: '#9CA3AF'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9CA3AF'
        },
        title: {
          display: true,
          text: 'Absorbance / Reflectance',
          color: '#9CA3AF'
        },
        min: 0,
        max: 2.5
      }
    },
    elements: {
      line: {
        tension: 0.4 // Smooth curve
      },
      point: {
        radius: 0
      }
    }
  };

  const chartData = {
    labels: Array.from({ length: data.length }, (_, i) => 700 + i * (1800 / data.length)), 
    datasets: [
      {
        fill: true,
        label: 'NIR Spectrum',
        data: data,
        borderColor: 'rgb(59, 130, 246)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
      },
    ],
  };

  return <Line options={options} data={chartData} />;
}

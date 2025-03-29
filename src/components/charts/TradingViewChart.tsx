import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, IChartApi, Time } from 'lightweight-charts';
import Image from 'next/image';
import { formatAmountV3 } from '@/utils/blockchainUtils';
import Spinner from '@/components/ui/Spinner';

// TODO: add different chart types (bars, line, area, etc)

interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PriceChartProps {
  data: ChartDataPoint[];
  liquidityEvents: any;
  tokenInfo: any;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, liquidityEvents, tokenInfo }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [showUniswapInfo, setShowUniswapInfo] = useState<boolean | null>(null);

  useEffect(() => {
    if (liquidityEvents) {
      setShowUniswapInfo(liquidityEvents.liquidityEvents.length > 0);
    }
  }, [liquidityEvents]);

  useEffect(() => {
    if (chartContainerRef.current && data.length >= 2 && showUniswapInfo === false) {
      const newChart: IChartApi = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { color: '#1f2937' },
          textColor: '#d1d5db',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          visible: true,
          borderVisible: true,
          alignLabels: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          autoScale: false,
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        watermark: {
          color: 'rgba(255, 255, 255, 0.1)',
          visible: true,
          text: 'Bondle.xyz',
          fontSize: 28,
          horzAlign: 'center',
          vertAlign: 'center',
        },
      });

      const candleSeries = newChart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350'
      });

      const enhancedChartData = enhanceSmallCandles(data);
      candleSeries.setData(enhancedChartData.map(item => ({
        time: item.time as Time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close
      })));

      candleSeries.applyOptions({
        priceFormat: {
          type: 'custom',
          formatter: formatPrice,
          minMove: 1e-9,
        },
      });

      const prices = enhancedChartData.flatMap(item => [item.open, item.high, item.low, item.close]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      const zoomFactor = 0.8;
      const priceRange = maxPrice - minPrice;
      const zoomedMinPrice = Math.max(0, minPrice - priceRange * (1 - zoomFactor) / 2);
      const zoomedMaxPrice = maxPrice + priceRange * (1 - zoomFactor) / 2;

      newChart.priceScale('right').applyOptions({
        autoScale: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      });

      newChart.timeScale().setVisibleRange({
        from: enhancedChartData[0].time as Time,
        to: enhancedChartData[enhancedChartData.length - 1].time as Time,
      });

      setChart(newChart);

      return () => {
        newChart.remove();
      };
    }
  }, [data, showUniswapInfo]);

  useEffect(() => {
    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chart]);

  if (showUniswapInfo === null) {
    return (
      <div className="w-full h-[500px] bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        <Spinner size="medium" />
      </div>
    );
  }

  if (showUniswapInfo && liquidityEvents.liquidityEvents.length > 0) {
    const event = liquidityEvents.liquidityEvents[0];
    return (
      <div className="w-full h-[500px] bg-gray-800 rounded-lg overflow-hidden flex flex-col items-center justify-center p-6">
        <Image src={tokenInfo.logo} alt={tokenInfo.name} width={64} height={64} className="rounded-full mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">{tokenInfo.name} Listed on Chewyswap</h2>
        <br/>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">Token</p>
            <p className="text-lg font-semibold text-white">{formatAmountV3(event.tokenAmount)} {tokenInfo.symbol}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">BONE</p>
            <p className="text-lg font-semibold text-white">{formatAmountV3(event.ethAmount)} BONE</p>
          </div>
        </div>
        <div className="flex space-x-4">
          <a
            href={`https://www.shibariumscan.io/tx/${event.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            View TXID
          </a>
          <a
            href={`https://chewyswap.dog/swap/?outputCurrency=${tokenInfo.address}&chain=shibarium`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded"
          >
            Buy on Chewy
          </a>
        </div>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="w-full h-[500px] bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        <p className="text-white text-lg">Not enough data to display chart</p>
      </div>
    );
  }

  return (
    <div ref={chartContainerRef} className="w-full h-[500px] bg-gray-800 rounded-lg overflow-hidden" />
  );
};

function enhanceSmallCandles(data: ChartDataPoint[]): ChartDataPoint[] {
  const minCandleSize = 1e-9;
  return data.map(item => {
    const bodySize = Math.abs(item.open - item.close);
    if (bodySize < minCandleSize) {
      const midPoint = (item.open + item.close) / 2;
      const adjustment = minCandleSize / 2;
      return {
        ...item,
        open: midPoint - adjustment,
        close: midPoint + adjustment,
        high: Math.max(item.high, midPoint + adjustment),
        low: Math.min(item.low, midPoint - adjustment)
      };
    }
    return item;
  });
}

function formatPrice(price: number) {
  return price.toFixed(9);
}

export default PriceChart;
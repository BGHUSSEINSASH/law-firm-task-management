import React from 'react';
import { FiCheckCircle, FiCircle, FiArrowRight } from 'react-icons/fi';

export const ProcessTimeline = ({ stages, currentStage }) => {
  return (
    <div className="w-full py-8" dir="rtl">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 via-cyan-500 to-slate-600 -translate-y-1/2 z-0"></div>

        {/* Stages */}
        <div className="relative z-10 flex justify-between w-full">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition transform ${
                    isCompleted
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 scale-110 shadow-lg shadow-green-500/50'
                      : isCurrent
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 scale-110 shadow-lg shadow-cyan-500/50 animate-pulse'
                      : 'bg-gradient-to-br from-slate-700 to-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <FiCheckCircle className="w-8 h-8 text-white" />
                  ) : (
                    <FiCircle className="w-8 h-8 text-white" />
                  )}
                </div>

                {/* Stage Name */}
                <p
                  className={`mt-3 text-center font-bold transition ${
                    isCurrent
                      ? 'text-cyan-400 text-sm md:text-base'
                      : isCompleted
                      ? 'text-green-400 text-sm'
                      : 'text-slate-400 text-xs md:text-sm'
                  }`}
                >
                  {stage.name}
                </p>

                {/* Progress indicator */}
                {isCurrent && (
                  <div className="mt-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 text-center">
        <p className="text-cyan-400 font-semibold text-lg">
          {stages[currentStage].name}
        </p>
        <p className="text-slate-400 text-sm mt-1">
          {stages[currentStage].description}
        </p>
      </div>
    </div>
  );
};

export const StageCard = ({ stage, isActive, isCompleted, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl p-6 transition transform hover:scale-105 border-2 ${
        isCompleted
          ? 'bg-gradient-to-br from-green-900 to-emerald-900 border-green-500 shadow-lg shadow-green-500/30'
          : isActive
          ? 'bg-gradient-to-br from-cyan-900 to-blue-900 border-cyan-500 shadow-lg shadow-cyan-500/50 scale-105'
          : 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{stage.name}</h3>
          <p className="text-slate-400 text-sm mt-1">{stage.description}</p>
        </div>
        <div
          className={`p-2 rounded-full ${
            isCompleted
              ? 'bg-green-500/20'
              : isActive
              ? 'bg-cyan-500/20 animate-pulse'
              : 'bg-slate-600/20'
          }`}
        >
          {isCompleted ? (
            <FiCheckCircle className="w-6 h-6 text-green-400" />
          ) : (
            <FiCircle className="w-6 h-6 text-cyan-400" />
          )}
        </div>
      </div>

      {stage.details && (
        <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded">
          {stage.details}
        </div>
      )}
    </div>
  );
};

export const VerticalTimeline = ({ events }) => {
  return (
    <div className="space-y-8 py-8" dir="rtl">
      {events.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Vertical line */}
          {index < events.length - 1 && (
            <div className="absolute right-7 top-16 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-blue-500 to-slate-600"></div>
          )}

          {/* Timeline item */}
          <div className="flex gap-6 items-start">
            {/* Circle */}
            <div
              className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center z-10 ${
                event.status === 'completed'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50'
                  : event.status === 'in_progress'
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50 animate-pulse'
                  : 'bg-gradient-to-br from-slate-700 to-slate-600'
              }`}
            >
              {event.status === 'completed' ? (
                <FiCheckCircle className="w-8 h-8 text-white" />
              ) : (
                <FiCircle className="w-8 h-8 text-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-2">
              <h4 className="text-white font-bold text-lg">{event.title}</h4>
              <p className="text-slate-400 text-sm mt-1">{event.description}</p>
              {event.timestamp && (
                <p className="text-cyan-400 text-xs mt-2">{event.timestamp}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProcessTimeline;

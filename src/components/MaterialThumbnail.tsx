import React, {useState} from 'react';
import {resolveMaterialImage} from '../constants/materialImages';
import type {MaterialPreset} from '../types';
import {BlockIcon, BrickIcon} from './MaterialIcons';

interface MaterialThumbnailProps {
  material: Pick<MaterialPreset, 'id' | 'name' | 'category' | 'customImageDataUrl'> & {
    thicknessCm?: number;
  };
  sizeClass?: string;
}

export const MaterialThumbnail: React.FC<MaterialThumbnailProps> = ({
  material,
  sizeClass = 'w-16 h-16 rounded-2xl',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const src = resolveMaterialImage(material);

  if (imgFailed || !src) {
    return (
      <div
        className={`${sizeClass} bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0`}
      >
        {material.category === 'block' ? (
          <BlockIcon className="w-7 h-7" />
        ) : (
          <BrickIcon className="w-7 h-7" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 flex items-center justify-center`}
    >
      <img
        src={src}
        alt={`تصویر ${material.name}`}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImgFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

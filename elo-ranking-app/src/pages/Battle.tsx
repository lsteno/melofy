import React from 'react';
import BattleComponent from '@/components/ui/BattleComponent';
import { useParams } from 'react-router-dom';

export const Battle = () => {
  const { listId } = useParams();
  console.log(listId);
  return (
    <div className="container mx-auto max-w-2xl p-6">
      <BattleComponent list={listId} />
    </div>
  );
};

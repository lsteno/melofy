import React from 'react';
import BattleComponent from '@/components/ui/BattleComponent';
import { withRouter } from 'react-router-dom';

export const Battle = () => {
  return (
    <div className="container mx-auto max-w-2xl p-6">
      <BattleComponent list={this.prop.match} />
    </div>
  );
};

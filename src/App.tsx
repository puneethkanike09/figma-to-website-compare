import { useState } from 'react';
import { UploadPage } from './components/UploadPage';
import { ComparisonView } from './components/ComparisonView';

interface ComparisonData {
  imageUrl: string;
  websiteUrl: string;
  frameWidth: number;
  frameHeight: number;
}

function App() {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);

  if (comparison) {
    return (
      <ComparisonView
        imageUrl={comparison.imageUrl}
        websiteUrl={comparison.websiteUrl}
        frameWidth={comparison.frameWidth}
        frameHeight={comparison.frameHeight}
        onBack={() => setComparison(null)}
      />
    );
  }

  return <UploadPage onStartComparison={setComparison} />;
}

export default App;

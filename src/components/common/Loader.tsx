/**
 * Loader — Chỉ hỗ trợ Dark Mode
 */
import React from 'react';
import SupportHRLoading from '@/components/common/SupportHRLoading';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <SupportHRLoading
      mode="panel"
      minHeightClass="min-h-[18rem]"
      label="Support HR // Loader"
      title={message || 'Đang xử lý với AI'}
      description="Quá trình này có thể mất một chút thời gian để đảm bảo kết quả ổn định và rõ ràng hơn."
    />
  );
};

export default Loader;

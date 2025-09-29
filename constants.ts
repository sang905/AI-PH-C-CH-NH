export const DEFAULT_PROMPT_HEADER = `Bạn là một chuyên gia AI phục chế ảnh. Nhiệm vụ của bạn là khôi phục, sửa chữa và cải thiện bức ảnh được cung cấp một cách tự nhiên và chân thực.

- Nếu có ảnh mặt nạ, bạn phải thực hiện phục chế và cải thiện CHỈ trên vùng được che bởi mặt nạ. Các thay đổi phải hòa trộn liền mạch với các phần không được che.
- Nếu không có mặt nạ, hãy xử lý toàn bộ ảnh.
`;

export const OPTIONAL_PROMPTS = {
    basicRestore: "\n- Tác vụ: Thực hiện phục chế cơ bản: xóa vết xước, làm rõ nét, loại bỏ nhiễu, phục hồi chi tiết hỏng và tăng cường các đặc điểm trên khuôn mặt một cách tự nhiên.",
    colorize: "\n- Tác vụ: Tô màu cho ảnh đen trắng với màu sắc tự nhiên và phù hợp với lịch sử.",
    upscale: "\n- Tác vụ: Nâng cấp độ phân giải của ảnh để tăng cường chi tiết và độ rõ nét.",
    adjustLighting: {
        increase: "\n- Tác vụ: Điều chỉnh ánh sáng để làm cho ảnh sáng hơn.",
        decrease: "\n- Tác vụ: Điều chỉnh ánh sáng để làm cho ảnh tối hơn một cách nghệ thuật.",
        natural: "\n- Tác vụ: Điều chỉnh ánh sáng để trông giống như được chụp dưới ánh sáng mặt trời tự nhiên.",
        studio: "\n- Tác vụ: Điều chỉnh ánh sáng để mô phỏng ánh sáng studio chuyên nghiệp.",
    },
    background: {
        remove: "\n- Tác vụ: Tách và xóa nền khỏi ảnh.",
        blur: "\n- Tác vụ: Làm mờ hậu cảnh để làm nổi bật chủ thể.",
        replace: (desc: string) => `\n- Tác vụ: Thay thế hậu cảnh bằng: ${desc}.`,
    },
    creativeMode: {
        vintage: "\n- Tác vụ: Áp dụng phong cách sáng tạo cổ điển (vintage) cho ảnh đã phục chế.",
        cinematic: "\n- Tác vụ: Áp dụng tông màu và hiệu ứng điện ảnh (cinematic).",
        cartoon: "\n- Tác vụ: Áp dụng hiệu ứng hoạt hình hoặc cách điệu tinh tế.",
    },
    outputColor: {
        keep_bw: "\n- Yêu cầu đầu ra: Nếu ảnh gốc là đen trắng, hãy đảm bảo ảnh kết quả cũng là đen trắng.",
        studio_colorize: "\n- Yêu cầu đầu ra: Tô màu cho ảnh với phong cách studio 2025 hiện đại và nghệ thuật.",
    },
    userInstructions: (instructions: string) => `\n\nHướng dẫn cụ thể của người dùng:\n${instructions}`,
    outputNote: "\n\nLưu ý: Chỉ trả về hình ảnh đã được phục chế. Không bao gồm bất kỳ văn bản giải thích nào trừ khi có sự cố xảy ra."
};

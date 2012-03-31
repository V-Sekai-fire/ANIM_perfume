#!/usr/bin/ruby1.9

require "json"

class BVH
    def initialize(bvhFile)
        open(bvhFile) do |f|
            @lines = f.readlines
        end
        @index = 0
        @depth = 0
    end
    
    def parse
        while !@lines.empty? do
            line = @lines.shift.strip
            case line
            when /hierarchy/i 
                @root = readJoint(Hash.new)
            when /motion/i
                @motion = readMotion
            else
                puts "parse error line:" + line
                exit 1
            end
        end
    end

    # parse bvh
    # generate json
    # { name : Hips,
    #   offset : [0.0, 0,0, 0,0],
    #   channels : { count : { Xposition, Yposition, Zposition, Yrotation, Xrotation, Zrotatin }
    #   joint : { name : Chest .. }
    # }

    def readJoint(obj)
        child = nil
        while !@lines.empty? do
            line = @lines.shift.strip
            case line
            when /^offset/i
                offsets = line.split(/\s+/)[1..-1]
                obj[:offset] = offsets
            when /^channels/i
                channels = line.split(/\s+/)[1..-1]
                channelCount = channels.shift.to_i
                @index += channelCount
                obj[:channels] = channels.map { |i| i[0..3].downcase }
            when /^(root|joint|end)/i
                # initialize joint
                name = line.split(/\s+/)[1]
#                 puts "name : #{name}"
                child ||= Hash.new
                child[:name] = name
                child[:index] = @index
            when /\{/
                if child.nil? then
                    puts "error : child is nil"
                    exit 1
                end
                @depth += 1
                obj[:child] ||= Array.new
                obj[:child].push( readJoint(child) )
                return obj[:child] if @depth == 0
            when /\}/
                @depth -= 1
                return obj
            else
                puts "hierarchy error line:" + line
                puts "depth : #{@depth}"
                exit 1
                return obj
            end
        end
    end

    def readMotion
        2.times do |i|
            line = @lines.shift.strip
            dats = line.split(/:\s*/)
            case dats[0]
            when /frame\s+time/i
                @frameTime = dats[1].to_f
            when /frames/i
                @frames = dats[1].to_i
            end
        end
        motion = Array.new
        @frames.times do |i|
            line = @lines.shift.strip
            nums = line.split(/\s+/)
            if nums.size != @index then
                puts "error motion data count is not #{@index} (but #{nums.size})"
            end
            motion.push(nums)
        end
        motion
    end

    def object
        obj = Hash.new
        obj[:root] = @root
        obj[:frames] = @frames
        obj[:frameTime] = @frameTime
        obj[:motion] = @motion
        obj
    end

    attr_reader :frames, :frameTime, :root, :motion 
end



#------------------------------------------------------------
#   main
#------------------------------------------------------------

if ARGV.size > 0 then
    bvhFile = ARGV.shift
else
    bvhFile = "data/A_test.bvh"
end

bvh = BVH.new(bvhFile)
bvh.parse

print JSON[bvh.object, :max_nesting => 100]